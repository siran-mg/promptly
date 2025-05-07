"use client";

import { CalendarClock, Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotifications } from "@/contexts/notifications-context";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Button } from "@/components/ui/button";
import { NavigationLink } from "@/components/ui/navigation-link";

export function MobileAppBar() {
  const { unreadCount } = useNotifications();
  const t = useTranslations();

  return (
    <div className="flex h-full w-full items-center justify-between">
      {/* Hamburger Menu */}
      <MobileNav />
      
      {/* App Title */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
          <CalendarClock className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-base">{t('common.appName')}</span>
      </div>
      
      {/* Notification Icon */}
      <NavigationLink href="/dashboard/notifications">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </NavigationLink>
    </div>
  );
}
