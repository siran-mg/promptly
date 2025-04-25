"use client";

import { FormSettingsPerType } from "@/components/settings/form-settings-per-type";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Palette, FileText } from "lucide-react";
import { Database } from "@/types/supabase";
import { useRouter } from "next/navigation";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { useTranslations } from "next-intl";

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
  const t = useTranslations();

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Button
            variant="outline"
            onClick={handleBack}
            className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('settings.appointmentTypes.backToTypes')}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/settings?tab=appointment-types&appointmentTypeId=${appointmentTypeId}&view=fields`)}
            className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <FileText className="h-4 w-4" />
            {t('settings.appointmentTypes.manageCustomFields')}
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-indigo-50/50 rounded-lg border border-indigo-100 mb-6">
        <div>
          <h2 className="text-xl font-medium flex items-center gap-2">
            <Palette className="h-5 w-5 text-indigo-600" />
            {t('settings.appointmentTypes.formSettingsFor', { name: appointmentType.name })}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.appointmentTypes.formSettingsDescription')}
          </p>
        </div>
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
          style={{ backgroundColor: appointmentType.color || '#6366f1' }}
        ></div>
      </div>

      <FormSettingsPerType
        appointmentTypeId={appointmentTypeId}
        appointmentType={appointmentType}
      />
    </div>
  );
}
