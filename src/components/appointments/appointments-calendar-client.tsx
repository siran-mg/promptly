"use client";

import { AppointmentsCalendar } from "./appointments-calendar";
import { Database } from "@/types/supabase";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface AppointmentsCalendarClientProps {
  appointments: Appointment[];
}

export function AppointmentsCalendarClient({ appointments }: AppointmentsCalendarClientProps) {
  return <AppointmentsCalendar appointments={appointments} />;
}
