"use client";

import { useEffect } from "react";
import { fixBodyStyle, setupBodyStyleObserver } from "@/lib/fix-body-style";

/**
 * Component that fixes the body style issue with pointer-events: none
 * This component should be added to the root layout to ensure it's always active
 */
export function BodyStyleFixer() {
  useEffect(() => {
    // Fix the body style immediately in case it's already broken
    fixBodyStyle();
    
    // Set up the observer to watch for changes to the body style
    const observer = setupBodyStyleObserver();
    
    // Set up a timer to periodically check and fix the body style
    const intervalId = setInterval(() => {
      fixBodyStyle();
    }, 1000);
    
    // Clean up the observer and interval when the component unmounts
    return () => {
      if (observer) {
        observer.disconnect();
      }
      clearInterval(intervalId);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}
