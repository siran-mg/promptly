"use client";

import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  if (appointmentTypes.length === 0) {
    return null;
  }

  // Get the active type name if there is one
  const activeTypeName = activeTypeId
    ? appointmentTypes.find(t => t.id === activeTypeId)?.name
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={activeTypeId ? "default" : "outline"}
          className={`gap-2 h-10 ${activeTypeId
            ? "bg-amber-600 hover:bg-amber-700 text-white"
            : "border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"}`}
        >
          <Filter className="h-4 w-4" />
          {activeTypeId ? `Type: ${activeTypeName}` : "Filter by Type"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-indigo-700">Appointment Types</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {appointmentTypes.map((type) => (
          <DropdownMenuItem
            key={type.id}
            className="hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
            onClick={() => {
              window.location.href = `/dashboard/appointments?type=${type.id}`;
            }}
          >
            <div className="flex items-center w-full">
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
