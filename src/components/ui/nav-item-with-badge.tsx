"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavItemWithBadgeProps {
  href: string;
  title: string;
  icon: LucideIcon;
  badgeCount?: number;
  activePaths?: string[];
}

export function NavItemWithBadge({
  href,
  title,
  icon: Icon,
  badgeCount,
  activePaths = [],
}: NavItemWithBadgeProps) {
  const pathname = usePathname();

  // Check if this item is active
  const isActive =
    pathname === href ||
    activePaths.some(path => {
      if (path.endsWith('$')) {
        const regex = new RegExp(path);
        return regex.test(pathname);
      }
      return pathname.startsWith(path);
    });

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-indigo-50 text-indigo-700"
          : "text-muted-foreground hover:bg-indigo-50/50 hover:text-indigo-600"
      )}
    >
      <div className={cn(
        "p-1 rounded-md",
        isActive ? "bg-indigo-100 text-indigo-700" : "text-muted-foreground"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <span>{title}</span>
      {badgeCount && badgeCount > 0 && (
        <div className="ml-auto bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {badgeCount > 99 ? '99+' : badgeCount}
        </div>
      )}
      {isActive && (!badgeCount || badgeCount === 0) && (
        <div className="ml-auto w-1.5 h-5 rounded-full bg-indigo-600"></div>
      )}
    </Link>
  );
}
