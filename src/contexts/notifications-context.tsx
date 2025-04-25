"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase";

interface NotificationsContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  const refreshUnreadCount = async () => {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    if (error) {
      console.error("Error fetching notifications count:", error);
      return;
    }

    setUnreadCount(count || 0);
  };

  useEffect(() => {
    refreshUnreadCount();

    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('notifications_count_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, () => {
        refreshUnreadCount();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications'
      }, () => {
        refreshUnreadCount();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications'
      }, () => {
        // Always refresh the count when a notification is deleted
        // The real-time event doesn't tell us if the deleted notification was unread
        refreshUnreadCount();
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

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
