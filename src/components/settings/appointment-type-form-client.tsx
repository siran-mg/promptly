"use client";

import { FormSettingsPerType } from "@/components/settings/form-settings-per-type";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Database } from "@/types/supabase";
import { useRouter } from "next/navigation";

type AppointmentType = Database["public"]["Tables"]["appointment_types"]["Row"];

interface AppointmentTypeFormClientProps {
  appointmentTypeId: string;
  appointmentType: AppointmentType;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function AppointmentTypeFormClient({
  appointmentTypeId,
  appointmentType,
  onBack,
  showBackButton = true
}: AppointmentTypeFormClientProps) {
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
            onClick={() => router.push(`/dashboard/settings?tab=appointment-types&appointmentTypeId=${appointmentTypeId}&view=fields`)}
          >
            Manage Custom Fields
          </Button>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Form Settings for {appointmentType.name}</h2>
        <p className="text-muted-foreground">
          Customize how the booking form appears to clients for this appointment type.
          These settings control the appearance of the form when clients book this specific type of appointment.
        </p>
      </div>

      <FormSettingsPerType
        appointmentTypeId={appointmentTypeId}
        appointmentType={appointmentType}
      />
    </div>
  );
}
