import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'success' | 'warning' | 'error' | 'info';
  related_table?: string;
  related_id?: string;
  user_id?: string | null;
  created_at: string;
  is_read: boolean;
}

let notificationChannel: RealtimeChannel | null = null;

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchNotifications();

    // Set up real-time subscription
    setupRealtimeSubscription();

    // Cleanup on unmount
    return () => {
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
        notificationChannel = null;
      }
    };
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifs = (data || []).map(n => ({
        ...n,
        is_read: false, // You can add a read status column if needed
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Remove existing channel if any
    if (notificationChannel) {
      supabase.removeChannel(notificationChannel);
    }

    // Create new channel for notifications
    notificationChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as NotificationData;

          // Only show if it's for this user or global
          if (!newNotification.user_id || newNotification.user_id === userId) {
            setNotifications(prev => [{ ...newNotification, is_read: false }, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show toast notification
            const toastType = newNotification.type === 'success' ? toast.success :
                             newNotification.type === 'error' ? toast.error :
                             newNotification.type === 'warning' ? toast.warning :
                             toast.info;

            toastType(newNotification.title, {
              description: newNotification.body,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to notifications channel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to notifications');
          toast.error('Real-time bildirishnomalar xato');
        }
      });
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    refresh: fetchNotifications,
  };
};

// Hook for incoming jobs real-time updates
export const useIncomingJobsRealtime = (employerId?: string, onUpdate?: () => void) => {
  useEffect(() => {
    if (!employerId) return;

    const channel = supabase
      .channel('incoming_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incoming_jobs',
          filter: `employer_id=eq.${employerId}`,
        },
        (payload) => {
          console.log('Incoming job changed:', payload);

          if (payload.eventType === 'INSERT') {
            toast.info('Yangi ish qo\'shildi', {
              description: `${(payload.new as any).job_name} - tasdiqlash kutilmoqda`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            if (newData.approval_status === 'approved') {
              toast.success('Ish tasdiqlandi', {
                description: newData.job_name,
              });
            }
          }

          onUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employerId, onUpdate]);
};
