"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface EmptyClientsStateProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export function EmptyClientsState({
  title,
  description,
  buttonText,
  onButtonClick,
}: EmptyClientsStateProps) {
  const router = useRouter();
  const t = useTranslations("clients");

  // Set default values using translations
  const defaultTitle = t('empty.title');
  const defaultDescription = t('empty.description');
  const defaultButtonText = t('empty.addFirstClient');

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      router.push('/dashboard/appointments/new');
    }
  };

  return (
    <Card className="border-indigo-100 overflow-hidden">
      <div className="h-1 bg-indigo-600"></div>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{title || defaultTitle}</CardTitle>
        <CardDescription className="text-base">
          {description || defaultDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pb-8 gap-4">
        <div className="bg-indigo-50 p-4 rounded-full">
          <Users className="h-16 w-16 text-indigo-600" />
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2"
          onClick={handleButtonClick}
        >
          <Plus className="h-4 w-4" />
          {buttonText || defaultButtonText}
        </Button>
      </CardContent>
    </Card>
  );
}
