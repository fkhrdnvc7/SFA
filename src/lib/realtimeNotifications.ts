import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch user's read status from notification_reads table
      const { data: readData } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', userId);

      const readIds = new Set((readData || []).map(r => r.notification_id));

      const notifs = (data || []).map(n => ({
        ...n,
        is_read: readIds.has(n.id),
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
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
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!userId) return;

    // Save to database
    const { error } = await supabase
      .from('notification_reads')
      .upsert({
        notification_id: notificationId,
        user_id: userId,
        read_at: new Date().toISOString()
      });

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const records = unreadIds.map(id => ({
      notification_id: id,
      user_id: userId,
      read_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('notification_reads')
      .upsert(records);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Barcha xabarnomalar o\'qildi');
    }
  };

  const clearNotification = async (notificationId: string) => {
    if (!userId) return;

    // Mark as read first, then remove from local state
    await supabase
      .from('notification_reads')
      .upsert({
        notification_id: notificationId,
        user_id: userId,
        read_at: new Date().toISOString()
      });

    const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
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
