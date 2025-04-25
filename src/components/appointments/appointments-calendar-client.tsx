"use client";

import { useState, useEffect } from "react";
import { AppointmentsCalendar } from "./appointments-calendar";
import { Database } from "@/types/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, CalendarClock } from "lucide-react";
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
      {/* Always show filters and search when there are appointments in the database */}
      <>
        {/* Active filters display */}
          {(activeTypeId || activeFieldName) && (
            <div className="bg-indigo-50 p-4 rounded-md flex items-center justify-between mb-4 border border-indigo-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-indigo-700">Active filters:</span>
                {activeTypeId && (
                  <div className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1.5 rounded-full flex items-center shadow-sm">
                    <span className="mr-1">Type:</span>
                    <span className="font-medium">
                      {appointmentTypes.find(t => t.id === activeTypeId)?.name || 'Unknown Type'}
                    </span>
                  </div>
                )}
                {activeFieldName && (
                  <div className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1.5 rounded-full flex items-center shadow-sm">
                    <span className="mr-1">Field:</span>
                    <span className="font-medium">{activeFieldName}</span>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                onClick={() => {
                  window.location.href = '/dashboard/appointments';
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Search and filter controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
              <Input
                type="search"
                placeholder="Search by client name, email, or phone..."
                className="pl-10 h-10 border-indigo-200 focus-visible:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {appointmentTypes.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 h-10 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                    <Filter className="h-4 w-4" />
                    Filter by Type
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
            )}
          </div>

          {/* Show appropriate message when no appointments are found */}
          {filteredAppointments.length === 0 && (
            <div className={`p-6 rounded-md text-center my-6 border ${searchQuery || activeTypeId || activeFieldName ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-200'}`}>
              {searchQuery || activeTypeId || activeFieldName ? (
                <>
                  <Search className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-amber-800 mb-1">No matching appointments</h3>
                  <p className="text-amber-700">Try adjusting your search terms or clear filters to see more results.</p>
                </>
              ) : (
                <>
                  <CalendarClock className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-indigo-700 mb-1">No appointments yet</h3>
                  <p className="text-indigo-600">Create your first appointment to get started.</p>
                </>
              )}
            </div>
          )}
      </>

      <AppointmentsCalendar
        appointments={filteredAppointments}
        appointmentTypes={appointmentTypes}
      />
    </>
  );
}