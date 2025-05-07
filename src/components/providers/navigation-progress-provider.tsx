"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NavigationProgress } from "@/components/ui/navigation-progress";

export function NavigationProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = React.useState(false);
  
  // Store the previous path to detect navigation
  const previousPathRef = React.useRef<string | null>(null);
  // Store timeout IDs for cleanup
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
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
    
    // If the path changed, show the navigation indicator
    if (previousPathRef.current !== fullPath) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Start the progress animation
      setIsNavigating(true);
      
      // Hide the indicator after a delay to simulate completion
      // Use a longer timeout to ensure the animation completes
      timeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
        timeoutRef.current = null;
      }, 700); // Slightly longer than the animation duration
      
      // Update the previous path
      previousPathRef.current = fullPath;
    }
    
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, searchParams]);
  
  return (
    <>
      <NavigationProgress isAnimating={isNavigating} />
      {children}
    </>
  );
}
