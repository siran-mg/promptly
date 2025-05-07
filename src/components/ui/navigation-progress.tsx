"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface NavigationProgressProps {
  isAnimating: boolean;
  className?: string;
}

export function NavigationProgress({
  isAnimating,
  className,
}: NavigationProgressProps) {
  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 h-1 z-50 bg-transparent pointer-events-none",
        isAnimating ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <div
        className={cn(
          "h-full bg-indigo-600 transition-all duration-300 ease-in-out shadow-[0_0_8px_rgba(79,70,229,0.6)]",
          isAnimating ? "animate-progress" : "w-0"
        )}
        style={{
          // Add a subtle glow effect
          boxShadow: "0 0 8px rgba(79, 70, 229, 0.6)"
        }}
      />
    </div>
  );
}
