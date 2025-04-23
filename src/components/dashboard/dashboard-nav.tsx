"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, Home, Settings, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: <Home className="mr-2 h-4 w-4" />,
  },
  {
    title: "Appointments",
    href: "/dashboard/appointments",
    icon: <CalendarClock className="mr-2 h-4 w-4" />,
  },
  {
    title: "Clients",
    href: "/dashboard/clients",
    icon: <Users className="mr-2 h-4 w-4" />,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="mr-2 h-4 w-4" />,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2 p-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
      <div className="mt-auto pt-4">
        <LogoutButton variant="outline" />
      </div>
    </nav>
  );
}
