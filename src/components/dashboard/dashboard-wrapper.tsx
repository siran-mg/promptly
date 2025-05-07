"use client";

import React from "react";
import { NavigationProgressBar } from "@/components/ui/navigation-progress-bar";
import { NavigationProvider } from "@/contexts/navigation-context";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export function DashboardWrapper({ children }: DashboardWrapperProps) {
  return (
    <NavigationProvider>
      <NavigationProgressBar />
      {children}
    </NavigationProvider>
  );
}
