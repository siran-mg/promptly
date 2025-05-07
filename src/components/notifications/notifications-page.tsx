"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { CalendarClock, Check, Trash2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDateFormatter } from "@/hooks/use-date-formatter";

interface Notification {
  id: string;
  type: string;
  content: any;
  is_read: boolean;
  created_at: string;
  related_id: string | null;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations();
  const { formatDate } = useDateFormatter();

  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: t('common.error'),
        description: t('notifications.errors.loadFailed'),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    setIsLoading(false);
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("Error marking notification as read:", error);
      return;
    }

    // Update local state
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, is_read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.is_read)
      .map(n => n.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return;
    }

    // Update local state
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, is_read: true }))
    );
    setUnreadCount(0);

    toast({
      title: t('common.success'),
      description: t('notifications.allMarkedAsRead'),
    });
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    // Find the notification to check if it's unread before deleting
    const notificationToDelete = notifications.find(notif => notif.id === id);
    const wasUnread = notificationToDelete && !notificationToDelete.is_read;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting notification:", error);
      return;
    }

    // Update local state
    setNotifications(prev => prev.filter(notif => notif.id !== id));

    // Update unread count if the deleted notification was unread
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    toast({
      title: t('common.success'),
      description: t('notifications.deleted'),
    });
  };

  // View appointment details
  const viewAppointment = (notif: Notification) => {
    if (!notif.related_id) return;

    // Mark as read first
    markAsRead(notif.id);

    // Navigate to appointment details
    router.push(`/dashboard/appointments?appointmentId=${notif.related_id}`);
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => {
        fetchNotifications();
      });

    // Subscribe with error handling
    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        // Try to reconnect after a delay
        setTimeout(() => {
          channel.subscribe();
        }, 5000);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render empty state
  if (notifications.length === 0) {
    return (
      <div className="p-4 sm:p-6 text-center border rounded-lg">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
        </div>
        <h3 className="text-base sm:text-lg font-medium">{t('notifications.empty.title')}</h3>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {t('notifications.empty.description')}
        </p>
      </div>
    );
  }

  return (
    <div className="px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-4">
        <div>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('notifications.unreadCount', { count: unreadCount })}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="self-end sm:self-auto"
        >
          {t('notifications.markAllAsRead')}
        </Button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-3 sm:p-4 border rounded-lg ${notif.is_read ? 'bg-white' : 'bg-indigo-50/30 border-indigo-100'}`}
          >
            {notif.type === 'new_appointment' && (
              <div className="flex flex-col sm:flex-row sm:items-start">
                <div className="flex items-start w-full">
                  <div className="flex-shrink-0 mr-3 sm:mr-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <CalendarClock className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <h3 className="text-sm sm:text-base font-medium">
                        {t('notifications.newAppointmentBooked')}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-0">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm mt-1">
                      {t('notifications.clientBookedAppointment', {
                        clientName: notif.content.clientName,
                        appointmentType: notif.content.appointmentTypeName,
                        date: formatDate(new Date(notif.content.date), { includeTime: true })
                      })}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {notif.related_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs sm:text-sm"
                          onClick={() => viewAppointment(notif)}
                        >
                          {t('notifications.viewAppointment')}
                        </Button>
                      )}
                      {!notif.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs sm:text-sm"
                          onClick={() => markAsRead(notif.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          <span className="hidden xs:inline">{t('notifications.markAsRead')}</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteNotification(notif.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span className="hidden xs:inline">{t('notifications.delete')}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
