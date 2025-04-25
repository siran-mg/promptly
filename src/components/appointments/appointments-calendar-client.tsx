"use client";

import { useState, useEffect } from "react";
import { AppointmentsCalendar } from "./appointments-calendar";
import { Database } from "@/types/supabase";
import { AppointmentFilterBar } from "./appointment-filter-bar";
import { NoMatchingAppointments } from "./no-matching-appointments";
import { EmptyAppointmentsState } from "./empty-appointments-state";
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

  // Only show filter bar if there are appointments or active filters
  return (
    <>
      {/* Only show filter bar if there are appointments or active filters */}
      {(appointments.length > 0 || activeTypeId || activeFieldName || searchQuery) && (
        <AppointmentFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          appointmentTypes={appointmentTypes}
          activeTypeId={activeTypeId}
          activeFieldName={activeFieldName}
        />
      )}

      {/* Show appropriate content based on state */}
      {appointments.length === 0 && !activeTypeId && !activeFieldName && !searchQuery ? (
        // No appointments and no filters - show empty state
        <EmptyAppointmentsState />
      ) : filteredAppointments.length === 0 ? (
        // Appointments exist but none match the filter - show no matching message
        <NoMatchingAppointments />
      ) : (
        // Show appointments calendar
        <AppointmentsCalendar
          appointments={filteredAppointments}
          appointmentTypes={appointmentTypes}
        />
      )}
    </>
  );
}