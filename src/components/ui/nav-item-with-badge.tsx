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

  // Extract the path without the locale prefix for comparison
  const pathWithoutLocale = pathname.split('/').slice(2).join('/');
  const hrefWithoutLocale = href.startsWith('/') ? href.substring(1) : href;

  // Special case for dashboard
  const isDashboard = href === '/dashboard' && (
    pathname.endsWith('/dashboard') ||
    pathname.split('/').length === 3 && pathname.endsWith('dashboard')
  );

  // Check if this item is active
  const isActive =
    isDashboard ||
    pathname === href ||
    // Check if the pathname matches any of the active paths
    activePaths.some(path => {
      if (path.endsWith('$')) {
        const regex = new RegExp(path);
        return regex.test(pathname);
      }
      // Check if the pathname starts with the path
      return pathname.startsWith(path);
    }) ||
    // Also check the path without locale
    pathWithoutLocale === hrefWithoutLocale ||
    activePaths.some(path => {
      const pathWithoutSlash = path.startsWith('/') ? path.substring(1) : path;
      if (pathWithoutSlash.endsWith('$')) {
        const regex = new RegExp(pathWithoutSlash);
        return regex.test(pathWithoutLocale);
      }
      return pathWithoutLocale.startsWith(pathWithoutSlash);
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
