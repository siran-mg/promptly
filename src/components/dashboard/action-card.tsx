"use client";

import { ReactNode } from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  iconName: string;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline";
  iconColor?: string;
}

export function ActionCard({
  iconName,
  title,
  description,
  href,
  onClick,
  variant = "outline",
  iconColor
}: ActionCardProps) {
  // Dynamically get the icon component from Lucide
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;

  const cardContent = (
    <>
      <div className={cn(
        "flex items-center justify-center mb-3 mt-1",
        iconColor ? "" : variant === "default" ? "text-white" : "text-indigo-600"
      )}>
        <IconComponent className={cn("h-7 w-7", iconColor)} />
      </div>
      <div className="text-center w-full px-3">
        <div className="font-medium text-base leading-tight mb-1">{title}</div>
        <div className={cn(
          "text-xs leading-tight",
          variant === "default" ? "text-white/90" : "text-muted-foreground"
        )}>
          {description}
        </div>
      </div>
    </>
  );

  const cardClasses = cn(
    "h-full flex flex-col items-center py-4 px-2 rounded-md transition-all duration-200",
    variant === "default"
      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
      : "bg-white hover:bg-gray-50 border shadow-sm"
  );

  // If href is provided, render as a Link
  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {cardContent}
      </Link>
    );
  }

  // If onClick is provided, render as a clickable div
  if (onClick) {
    return (
      <div className={cn(cardClasses, "cursor-pointer")} onClick={onClick}>
        {cardContent}
      </div>
    );
  }

  // Fallback to a non-interactive div
  return (
    <div className={cardClasses}>
      {cardContent}
    </div>
  );
}
