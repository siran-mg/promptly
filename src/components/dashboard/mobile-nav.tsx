"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  CalendarClock, Settings, Users,
  User, Share, BarChart3,
  CalendarDays, Bell, Menu, Calendar
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NavigationLink } from "@/components/ui/navigation-link";
import { useNotifications } from "@/contexts/notifications-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { NavItemWithBadge } from "@/components/ui/nav-item-with-badge";
import { LucideIcon } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase";
import LanguageSwitcher from "@/components/language-switcher";

export function MobileNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const supabase = createClient();
  const [userProfile, setUserProfile] = useState<{
    full_name?: string;
    email?: string;
    avatar_url?: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setUserProfile({
          full_name: data?.full_name || user.user_metadata?.full_name,
          email: user.email,
          avatar_url: data?.avatar_url ?? user.user_metadata?.avatar_url,
        });
      }
    };

    fetchUserProfile();
  }, [supabase]);

  // Get initials from name or email
  const getInitials = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }

    if (userProfile?.email) {
      return userProfile.email.substring(0, 2).toUpperCase();
    }

    return 'U';
  };

  // Define navigation items - same as in desktop nav
  const navItems = [
    {
      title: t('dashboard.overview'),
      href: "/dashboard",
      icon: BarChart3,
      activePaths: ["/dashboard", "/dashboard$"]
    },
    {
      title: t('dashboard.appointments'),
      href: "/dashboard/appointments",
      icon: CalendarClock,
      activePaths: ["/dashboard/appointments"]
    },
    {
      title: t('settings.appointmentTypesMenu'),
      href: "/dashboard/appointment-types",
      icon: Calendar,
      activePaths: ["/dashboard/appointment-types"]
    },
    {
      title: t('dashboard.notifications'),
      href: "/dashboard/notifications",
      icon: Bell,
      ...(unreadCount > 0 ? { badge: unreadCount } : {}),
      activePaths: ["/dashboard/notifications"]
    },
    {
      title: t('dashboard.clients'),
      href: "/dashboard/clients",
      icon: Users,
      activePaths: ["/dashboard/clients"]
    },
    {
      title: t('dashboard.settings'),
      href: "/dashboard/settings",
      icon: Settings,
      activePaths: ["/dashboard/settings"]
    },
  ];

  // Quick actions
  const quickActions = [
    {
      title: t('dashboard.newAppointment'),
      href: "/dashboard/appointments/new",
      icon: CalendarDays,
    },
    {
      title: t('dashboard.shareBookingForm'),
      href: "/dashboard/settings?tab=form",
      icon: Share,
    },
  ];

  // Check if the current path matches the nav item
  const isActive = (href: string) => {
    // Extract the path without the locale prefix for comparison
    const pathWithoutLocale = pathname.split('/').slice(2).join('/');
    const hrefWithoutLocale = href.startsWith('/') ? href.substring(1) : href;

    // Special case for dashboard
    if (href === '/dashboard') {
      return pathname.endsWith('/dashboard') ||
             pathname.split('/').length === 3 && pathname.endsWith('dashboard') ||
             pathWithoutLocale === '';
    }

    return pathname.startsWith(href) || pathWithoutLocale.startsWith(hrefWithoutLocale);
  };

  // Close the sheet when a navigation item is clicked
  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t('common.menu')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col">
        <SheetHeader className="border-b border-indigo-100 p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-white" />
            </div>
            <SheetTitle className="font-bold text-lg">{t('common.appName')}</SheetTitle>
          </div>
        </SheetHeader>

        <div className="py-4 px-2 flex-1 overflow-y-auto">
          <div className="mb-2 px-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('common.mainMenu')}
            </p>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              // Use NavItemWithBadge for items with badges
              if (item.badge !== undefined) {
                return (
                  <NavItemWithBadge
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    icon={item.icon as LucideIcon}
                    badgeCount={item.badge}
                    activePaths={item.activePaths}
                    onClick={handleNavClick}
                  />
                );
              }

              // Use regular Link for items without badges
              const active = isActive(item.href);
              const Icon = item.icon as LucideIcon;

              return (
                <NavigationLink
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-muted-foreground hover:bg-indigo-50/50 hover:text-indigo-600"
                  )}
                >
                  <div className={cn(
                    "p-1 rounded-md",
                    active ? "bg-indigo-100 text-indigo-700" : "text-muted-foreground"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span>{item.title}</span>
                  {active && (
                    <div className="ml-auto w-1.5 h-5 rounded-full bg-indigo-600"></div>
                  )}
                </NavigationLink>
              );
            })}
          </div>

          {/* Quick Actions Section */}
          <div className="mt-8 mb-2 px-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('common.quickActions')}
            </p>
          </div>

          <div className="space-y-1">
            {quickActions.map((item) => {
              const Icon = item.icon as LucideIcon;

              return (
                <NavigationLink
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors"
                >
                  <div className="p-1 rounded-md text-muted-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span>{item.title}</span>
                </NavigationLink>
              );
            })}
          </div>
        </div>

        {/* User Profile */}
        <div className="mt-auto border-t border-indigo-100 p-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10 border border-indigo-100">
              <AvatarImage src={userProfile?.avatar_url || ''} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {userProfile?.full_name || userProfile?.email || t('common.user')}
              </p>
              {userProfile?.email && (
                <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              asChild
            >
              <NavigationLink
                href="/dashboard/settings?tab=profile"
                onClick={handleNavClick}
              >
                <User className="h-4 w-4 mr-1" />
                {t('common.profile')}
              </NavigationLink>
            </Button>

            <LogoutButton
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {t('settings.general.language')}
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
