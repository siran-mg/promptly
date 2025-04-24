"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock, Home, Settings, Users,
  LogOut, User, Share, BarChart3,
  CalendarDays, Clock, ChevronRight
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Appointments",
    href: "/dashboard/appointments",
    icon: <CalendarClock className="h-5 w-5" />,
  },
  {
    title: "Clients",
    href: "/dashboard/clients",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export function DashboardNav() {
  const pathname = usePathname();
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

  // Check if the current path matches the nav item
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* App Logo */}
      <div className="flex items-center gap-2 px-4 py-6 border-b border-indigo-100">
        <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center">
          <CalendarClock className="h-5 w-5 text-white" />
        </div>
        <div className="font-bold text-lg">Coachly</div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 px-3">
        <div className="mb-2 px-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Main Menu
          </p>
        </div>

        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
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
                  {item.icon}
                </div>
                <span>{item.title}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-5 rounded-full bg-indigo-600"></div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions Section */}
        <div className="mt-8 mb-2 px-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Actions
          </p>
        </div>

        <div className="space-y-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/appointments/new"
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors"
                >
                  <div className="p-1 rounded-md text-muted-foreground">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <span>New Appointment</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Create a new appointment</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/settings?tab=form"
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors"
                >
                  <div className="p-1 rounded-md text-muted-foreground">
                    <Share className="h-5 w-5" />
                  </div>
                  <span>Share Booking Form</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Share your booking form with clients</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </nav>

      {/* User Profile */}
      <div className="mt-auto border-t border-indigo-100 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 border border-indigo-100">
            <AvatarImage src={userProfile?.avatar_url || ''} />
            <AvatarFallback className="bg-indigo-100 text-indigo-700">{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {userProfile?.full_name || userProfile?.email || 'User'}
            </p>
            {userProfile?.email && (
              <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            asChild
          >
            <Link href="/dashboard/settings?tab=profile">
              <User className="h-4 w-4 mr-1" />
              Profile
            </Link>
          </Button>

          <LogoutButton
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          />
        </div>
      </div>
    </div>
  );
}
