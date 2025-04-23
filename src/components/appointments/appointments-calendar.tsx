"use client";

import { useState, useCallback } from "react";
import { Calendar, Views, DateLocalizer, SlotInfo } from "react-big-calendar";
import { dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import { useRouter } from "next/navigation";
import { Database } from "@/types/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Import the CSS for react-big-calendar
import "react-big-calendar/lib/css/react-big-calendar.css";

// Add custom styles for the calendar
import "@/styles/calendar.css";

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
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<string>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

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

  // Handle slot selection (clicking on a date)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo.start);
    setIsCreateDialogOpen(true);
  }, []);

  // Navigate to booking page with pre-filled date
  const handleCreateAppointment = useCallback(() => {
    if (selectedSlot) {
      const formattedDate = format(selectedSlot, "yyyy-MM-dd'T'HH:mm");
      router.push(`/booking?date=${encodeURIComponent(formattedDate)}`);
    }
    setIsCreateDialogOpen(false);
  }, [selectedSlot, router]);

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
    <>
      <div className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 rounded-full bg-primary mr-1.5 opacity-60"></div>
            <span>Click any date to create a new appointment</span>
          </div>
        </div>
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
          onSelectSlot={handleSelectSlot}
          selectable={true}
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
      </div>

      {/* Create Appointment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <span>Create an appointment for {format(selectedSlot, "PPP")}?</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAppointment} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
