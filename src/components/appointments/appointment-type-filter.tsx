"use client";

import { useState, useEffect } from "react";
import { Filter, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AppointmentType = {
  id: string;
  name: string;
  color: string | null;
  duration: number;
};

interface AppointmentTypeFilterProps {
  appointmentTypes: AppointmentType[];
  activeTypeId?: string;
}

export function AppointmentTypeFilter({ appointmentTypes, activeTypeId }: AppointmentTypeFilterProps) {
  const router = useRouter();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations();

  // Initialize selected types from activeTypeId
  useEffect(() => {
    if (activeTypeId) {
      setSelectedTypes([activeTypeId]);
    } else {
      setSelectedTypes([]);
    }
  }, [activeTypeId]);

  if (appointmentTypes.length === 0) {
    return null;
  }

  const handleTypeToggle = (typeId: string) => {
    // Create a new array to avoid mutating state directly
    let newSelectedTypes: string[];

    if (selectedTypes.includes(typeId)) {
      // Remove the type if it's already selected
      newSelectedTypes = selectedTypes.filter(id => id !== typeId);
    } else {
      // Add the type if it's not already selected
      newSelectedTypes = [...selectedTypes, typeId];
    }

    setSelectedTypes(newSelectedTypes);
  };

  const applyFilters = () => {
    // Close the dropdown
    setIsOpen(false);

    // Build the URL with selected types
    if (selectedTypes.length === 0) {
      // If no types selected, remove the type parameter
      router.push('/dashboard/appointments');
    } else if (selectedTypes.length === 1) {
      // If one type selected, use the simple format
      router.push(`/dashboard/appointments?type=${selectedTypes[0]}`);
    } else {
      // If multiple types selected, use a comma-separated list
      router.push(`/dashboard/appointments?type=${selectedTypes.join(',')}`);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={selectedTypes.length > 0 ? "default" : "outline"}
          className={`gap-2 h-10 ${selectedTypes.length > 0
            ? "bg-amber-600 hover:bg-amber-700 text-white"
            : "border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"}`}
        >
          <Filter className="h-4 w-4" />
          {t('appointments.filter.byType')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-indigo-700">{t('appointments.filter.appointmentTypes')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {appointmentTypes.map((type) => (
          <DropdownMenuItem
            key={type.id}
            className="hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              handleTypeToggle(type.id);
            }}
          >
            <div className="flex items-center w-full">
              <div className="w-5 h-5 mr-2 flex items-center justify-center">
                {selectedTypes.includes(type.id) && (
                  <Check className="h-4 w-4 text-amber-600" />
                )}
              </div>
              {type.color && (
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: type.color }}
                />
              )}
              <span>{type.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="p-2 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              setSelectedTypes([]);
              setIsOpen(false);
              router.push('/dashboard/appointments');
            }}
          >
            {t('appointments.filter.clear')}
          </Button>
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
            onClick={applyFilters}
          >
            {t('appointments.filter.apply')}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
