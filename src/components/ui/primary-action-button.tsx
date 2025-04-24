"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PrimaryActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: "default" | "indigo" | "green" | "amber" | "red";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  loadingText?: string;
  className?: string;
}

export function PrimaryActionButton({
  children,
  icon: Icon,
  variant = "indigo",
  size = "default",
  isLoading = false,
  loadingText,
  className,
  ...props
}: PrimaryActionButtonProps) {
  // Define variant styles
  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    indigo: "bg-indigo-600 text-white hover:bg-indigo-700",
    green: "bg-green-600 text-white hover:bg-green-700",
    amber: "bg-amber-600 text-white hover:bg-amber-700",
    red: "bg-red-600 text-white hover:bg-red-700",
  };

  // Get the appropriate style for the selected variant
  const variantStyle = variantStyles[variant];

  return (
    <Button
      className={cn(
        "gap-2 transition-colors",
        variantStyle,
        className
      )}
      size={size}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText || children}
        </>
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4" />}
          {children}
        </>
      )}
    </Button>
  );
}
