"use client";

import { CustomFieldsManager } from "@/components/settings/custom-fields-manager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface AppointmentTypeFieldsClientProps {
  appointmentTypeId: string;
  appointmentTypeName: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function AppointmentTypeFieldsClient({
  appointmentTypeId,
  appointmentTypeName,
  onBack,
  showBackButton = true
}: AppointmentTypeFieldsClientProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard/settings?tab=appointment-types");
    }
  };

  return (
    <div className="space-y-6">
      {showBackButton && (
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Types
          </Button>

          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/settings?tab=appointment-types&appointmentTypeId=${appointmentTypeId}&view=form`)}
          >
            Form Settings
          </Button>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Custom Fields for {appointmentTypeName}</h2>
        <p className="text-muted-foreground">
          Create and manage custom fields that clients will fill out when booking this appointment type.
          These fields allow you to collect specific information needed for this type of appointment.
        </p>
      </div>

      <CustomFieldsManager appointmentTypeId={appointmentTypeId} />
    </div>
  );
}
