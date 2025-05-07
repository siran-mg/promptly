"use client";

import React from "react";
import Link from "next/link";
import { useNavigation } from "@/contexts/navigation-context";

interface NavigationLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  children: React.ReactNode;
}

export function NavigationLink({ children, ...props }: NavigationLinkProps) {
  const { startNavigation } = useNavigation();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Don't trigger for external links, anchor links, or if modifier keys are pressed
    if (
      props.href.toString().startsWith("http") ||
      props.href.toString().startsWith("#") ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    // Start the navigation progress
    startNavigation();

    // Call the original onClick if it exists
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <Link {...props} onClick={handleClick}>
      {children}
    </Link>
  );
}
