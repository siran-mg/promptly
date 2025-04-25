"use client";

import { NotificationsProvider } from "@/contexts/notifications-context";

export function NotificationsProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NotificationsProvider>{children}</NotificationsProvider>;
}
