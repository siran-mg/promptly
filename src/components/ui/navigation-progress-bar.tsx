"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/contexts/navigation-context";

export function NavigationProgressBar() {
  const { isNavigating } = useNavigation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = React.useRef<string | null>(null);

  // This effect handles the completion of navigation
  const { endNavigation } = useNavigation();

  React.useEffect(() => {
    // Create a combined path+query string for comparison
    const fullPath = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // If this is the first render, just store the path
    if (previousPathRef.current === null) {
      previousPathRef.current = fullPath;
      return;
    }

    // If the path changed, we know navigation has completed
    if (previousPathRef.current !== fullPath) {
      // End the navigation progress
      endNavigation();

      // Update the previous path
      previousPathRef.current = fullPath;
    }
  }, [pathname, searchParams, endNavigation]);

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 h-1.5 z-50 bg-transparent pointer-events-none",
        isNavigating ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className={cn(
          "h-full bg-indigo-600 transition-all duration-500 ease-in-out shadow-[0_0_8px_rgba(79,70,229,0.6)]",
          isNavigating ? "animate-progress" : "w-0"
        )}
        style={{
          // Add a subtle glow effect
          boxShadow: "0 0 10px rgba(79, 70, 229, 0.7)"
        }}
      />
    </div>
  );
}
