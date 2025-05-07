"use client";

import { Button } from "@/components/ui/button";
import { FilterTag } from "./filter-tag";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type AppointmentType = {
  id: string;
  name: string;
  color: string | null;
  duration: number;
};

interface ActiveFiltersDisplayProps {
  activeTypeId?: string;
  activeFieldName?: string;
  appointmentTypes: AppointmentType[];
}

export function ActiveFiltersDisplay({
  activeTypeId,
  activeFieldName,
  appointmentTypes
}: ActiveFiltersDisplayProps) {
  const router = useRouter();
  const t = useTranslations();

  // Only show if there are active filters
  if (!activeTypeId && !activeFieldName) {
    return null;
  }

  const clearAllFilters = () => {
    router.push('/dashboard/appointments');
  };

  return (
    <div className="bg-amber-50 p-3 md:p-4 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 border border-amber-200">
      <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
        <span className="text-xs md:text-sm font-medium text-amber-800">{t('appointments.filter.activeFilters')}:</span>
        {activeTypeId && activeTypeId.split(',').map(typeId => (
          <FilterTag
            key={typeId}
            label={t('appointments.filter.typeLabel')}
            value={appointmentTypes.find(t => t.id === typeId)?.name || t('appointments.filter.unknownType')}
            paramName="type"
            paramValue={typeId}
          />
        ))}
        {activeFieldName && (
          <FilterTag
            label={t('appointments.filter.fieldLabel')}
            value={activeFieldName}
            paramName="field"
          />
        )}
      </div>
      <Button
        size="sm"
        className="w-full sm:w-auto mt-2 sm:mt-0 bg-amber-600 hover:bg-amber-700 text-white transition-colors font-medium text-xs md:text-sm py-1 h-auto md:h-9"
        onClick={clearAllFilters}
      >
        {t('appointments.filter.clearAll')}
      </Button>
    </div>
  );
}
