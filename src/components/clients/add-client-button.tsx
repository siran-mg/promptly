"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function AddClientButton() {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: "Add Client",
      description: "This feature is coming soon.",
      variant: "default",
    });
  };

  return (
    <Button
      size="sm"
      onClick={handleClick}
      className="bg-indigo-600 hover:bg-indigo-700 transition-colors"
    >
      <UserPlus className="mr-2 h-4 w-4" />
      Add New Client
    </Button>
  );
}
