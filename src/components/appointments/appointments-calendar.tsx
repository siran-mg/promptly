"use client";

import { useState, useCallback } from "react";
import { Calendar, Views, DateLocalizer } from "react-big-calendar";
import { dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import { Database } from "@/types/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

// Import the CSS for react-big-calendar
import "react-big-calendar/lib/css/react-big-calendar.css";

// Create a date localizer for the calendar
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface AppointmentsCalendarProps {
  appointments: Appointment[];
}

// Define the event type for the calendar
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  resource: Appointment;
}

export function AppointmentsCalendar({ appointments }: AppointmentsCalendarProps) {
  const { toast } = useToast();
  const [view, setView] = useState<string>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // Convert appointments to calendar events
  const events: CalendarEvent[] = appointments.map((appointment) => {
    const startDate = new Date(appointment.date);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1); // Assume 1 hour appointments

    return {
      id: appointment.id,
      title: appointment.client_name,
      start: startDate,
      end: endDate,
      status: appointment.status,
      resource: appointment,
    };
  });

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    toast({
      title: `Appointment with ${event.title}`,
      description: `${format(event.start, "PPP 'at' p")} - Status: ${event.status}`,
    });
  }, [toast]);

  // If no appointments, show empty state
  if (appointments.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>No appointments yet</CardTitle>
          <CardDescription>
            When you book appointments, they will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <CalendarClock className="h-16 w-16 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Custom event component to show status
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="flex flex-col h-full">
      <div className="text-sm font-medium">{event.title}</div>
      <div className="text-xs mt-1">
        {format(event.start, "p")}
      </div>
      <div className="mt-auto">
        <Badge
          variant={
            event.status === "scheduled" ? "default" :
            event.status === "completed" ? "success" :
            event.status === "cancelled" ? "destructive" :
            "outline"
          }
          className="text-xs"
        >
          {event.status}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="h-[700px] bg-white rounded-md border">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        views={["month", "week", "day"]}
        view={view as any}
        onView={(newView) => setView(newView)}
        date={date}
        onNavigate={setDate}
        onSelectEvent={handleSelectEvent}
        components={{
          event: EventComponent,
        }}
        eventPropGetter={(event) => {
          const backgroundColor =
            event.status === "scheduled" ? "#6366f1" :
            event.status === "completed" ? "#10b981" :
            event.status === "cancelled" ? "#ef4444" :
            "#6b7280";

          return {
            style: {
              backgroundColor,
              borderRadius: "4px",
              opacity: 0.8,
              color: "#fff",
              border: "0px",
              display: "block",
              padding: "4px",
              height: "100%",
            },
          };
        }}
      />
    </div>
  );
}
