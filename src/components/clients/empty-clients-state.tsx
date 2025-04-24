"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface EmptyClientsStateProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export function EmptyClientsState({
  title = "No Clients Yet",
  description = "Your client list will grow as you book appointments",
  buttonText = "Add Your First Client",
  onButtonClick,
}: EmptyClientsStateProps) {
  const router = useRouter();

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
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">
          {description}
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
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
