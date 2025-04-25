"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

export function AddClientButton() {
  const { toast } = useToast();
  const t = useTranslations();

  const handleClick = () => {
    toast({
      title: t('clients.add.title'),
      description: t('clients.add.comingSoon'),
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
      {t('clients.add.button')}
    </Button>
  );
}
