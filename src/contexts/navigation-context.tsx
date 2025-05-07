"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface NavigationContextType {
  isNavigating: boolean;
  startNavigation: () => void;
  endNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const startNavigation = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsNavigating(true);
  }, []);

  const endNavigation = useCallback(() => {
    // Add a small delay before ending the navigation to ensure the animation completes
    timeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
      timeoutRef.current = null;
    }, 500);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <NavigationContext.Provider value={{ isNavigating, startNavigation, endNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
