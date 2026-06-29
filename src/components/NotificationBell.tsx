import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  user_id: string | null;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch notifications
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch user's read status
      const { data: readData } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", user.id);

      const readIds = new Set((readData || []).map(r => r.notification_id));

      const filtered = (data || []).filter(
        (n) => n.user_id === user.id || n.user_id === null,
      ).map(n => ({
        ...n,
        is_read: readIds.has(n.id)
      }));

      setNotifications(filtered);
      setUnreadCount(filtered.filter((n) => !n.is_read).length);
    } catch {
      console.error("Xabarnomalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          if (newNotif.user_id !== null && newNotif.user_id !== user.id) return;

          toast.info(newNotif.title, { description: newNotif.body });
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("notification_reads")
      .upsert({
        notification_id: id,
        user_id: user.id,
        read_at: new Date().toISOString()
      });

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const records = unreadIds.map(id => ({
      notification_id: id,
      user_id: user.id,
      read_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from("notification_reads")
      .upsert(records);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("Barcha xabarnomalar o'qildi");
    }
  };

  const typeColor: Record<string, string> = {
    info: "border-l-blue-500",
    success: "border-l-green-500",
    warning: "border-l-yellow-500",
    error: "border-l-red-500",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Xabarnomalar</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={markAllAsRead}>
              Barchasini o'qilgan deb belgilash
            </Button>
          )}
        </div>
        <ScrollArea className="h-[350px]">
          {loading ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Yuklanmoqda...</p>
          ) : notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Xabarnomalar yo'q</p>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  className={cn(
                    "w-full border-l-4 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    typeColor[notif.type] || typeColor.info,
                    !notif.is_read && "bg-muted/30",
                  )}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-medium", !notif.is_read && "font-semibold")}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(notif.created_at).toLocaleString("uz-UZ")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
