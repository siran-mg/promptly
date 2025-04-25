"use client";

import { AppointmentSearch } from "./appointment-search";
import { AppointmentTypeFilter } from "./appointment-type-filter";
import { ActiveFiltersDisplay } from "./active-filters-display";

type AppointmentType = {
  id: string;
  name: string;
  color: string | null;
  duration: number;
};

interface AppointmentFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  appointmentTypes: AppointmentType[];
  activeTypeId?: string;
  activeFieldName?: string;
}

export function AppointmentFilterBar({
  searchQuery,
  setSearchQuery,
  appointmentTypes,
  activeTypeId,
  activeFieldName,
}: AppointmentFilterBarProps) {
  return (
    <div className="space-y-4 mb-4">
      <ActiveFiltersDisplay
        activeTypeId={activeTypeId}
        activeFieldName={activeFieldName}
        appointmentTypes={appointmentTypes}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <AppointmentSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <AppointmentTypeFilter
          appointmentTypes={appointmentTypes}
          activeTypeId={activeTypeId}
        />
      </div>
    </div>
  );
}
