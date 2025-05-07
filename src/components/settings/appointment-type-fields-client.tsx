"use client";

import { CustomFieldsManager } from "@/components/settings/custom-fields-manager";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, FormInput, Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { useTranslations } from "next-intl";

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
  const t = useTranslations();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard/appointment-types");
    }
  };

  return (
    <div className="space-y-6">
      {showBackButton && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
          <Button
            variant="outline"
            onClick={handleBack}
            className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('settings.appointmentTypes.backToTypes')}
          </Button>

          <PrimaryActionButton
            variant="default"
            onClick={() => router.push(`/dashboard/appointment-types/${appointmentTypeId}/form`)}
            icon={Palette}
            className="w-full sm:w-auto"
          >
            {t('settings.appointmentTypes.formCustomization')}
          </PrimaryActionButton>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 bg-indigo-50/50 rounded-lg border border-indigo-100 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-medium flex items-center gap-2">
            <FormInput className="h-5 w-5 text-indigo-600" />
            {t('settings.appointmentTypes.customFieldsFor', { name: appointmentTypeName })}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.appointmentTypes.customFieldsDescription')}
          </p>
        </div>
      </div>

      <CustomFieldsManager appointmentTypeId={appointmentTypeId} />
    </div>
  );
}
