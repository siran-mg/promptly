"use client";

import { useState, useEffect } from "react";
import { AppointmentsCalendar } from "./appointments-calendar";
import { Database } from "@/types/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// No need for router import

type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  appointment_type?: {
    id: string;
    name: string;
    color: string | null;
    duration: number;
  } | null;
  field_values?: {
    id: string;
    field_id: string;
    value: string | null;
  }[] | null;
};

type AppointmentType = {
  id: string;
  name: string;
  color: string | null;
  duration: number;
};

interface AppointmentsCalendarClientProps {
  appointments: Appointment[];
  appointmentTypes?: AppointmentType[];
  activeTypeId?: string;
  activeFieldName?: string;
}

export function AppointmentsCalendarClient({
  appointments,
  appointmentTypes = [],
  activeTypeId,
  activeFieldName
}: AppointmentsCalendarClientProps) {
  // No need for router here
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(appointments);

  // Filter appointments when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAppointments(appointments);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = appointments.filter(appointment => {
      return (
        (appointment.client_name && appointment.client_name.toLowerCase().includes(query)) ||
        (appointment.client_email && appointment.client_email.toLowerCase().includes(query)) ||
        (appointment.client_phone && appointment.client_phone.toLowerCase().includes(query)) ||
        (appointment.appointment_type?.name && appointment.appointment_type.name.toLowerCase().includes(query))
      );
    });

    setFilteredAppointments(filtered);
  }, [searchQuery, appointments]);

  return (
    <>
      {/* Active filters display */}
      {(activeTypeId || activeFieldName) && (
        <div className="bg-muted/50 p-3 rounded-md flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Active filters:</span>
            {activeTypeId && (
              <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center">
                <span className="mr-1">Type:</span>
                <span className="font-medium">
                  {appointmentTypes.find(t => t.id === activeTypeId)?.name || 'Unknown Type'}
                </span>
              </div>
            )}
            {activeFieldName && (
              <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center">
                <span className="mr-1">Field:</span>
                <span className="font-medium">{activeFieldName}</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.location.href = '/dashboard/appointments';
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Search and filter controls */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search appointments..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {appointmentTypes.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter by Type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Appointment Types</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {appointmentTypes.map((type) => (
                <DropdownMenuItem
                  key={type.id}
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
        )}
      </div>

      {/* Show "No results" message when search returns empty */}
      {filteredAppointments.length === 0 && searchQuery && (
        <div className="bg-muted/50 p-4 rounded-md text-center my-4">
          <p className="text-muted-foreground">No appointments match your search criteria.</p>
        </div>
      )}

      <AppointmentsCalendar
        appointments={filteredAppointments}
        appointmentTypes={appointmentTypes}
      />
    </>
  );
}