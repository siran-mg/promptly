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
    });
  };
  
  return (
    <Button size="sm" onClick={handleClick}>
      <UserPlus className="mr-2 h-4 w-4" />
      Add Client
    </Button>
  );
}
