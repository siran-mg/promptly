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
import { CalendarClock, Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { DeleteAppointmentDialog } from "./delete-appointment-dialog";
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

interface AppointmentsCalendarProps {
  appointments: Appointment[];
  appointmentTypes?: AppointmentType[];
}

// Define the event type for the calendar
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  resource: Appointment;
  typeColor: string | null;
  typeName: string;
}

export function AppointmentsCalendar({ appointments, appointmentTypes = [] }: AppointmentsCalendarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<string>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Convert appointments to calendar events
  const events: CalendarEvent[] = appointments.map((appointment) => {
    const startDate = new Date(appointment.date);
    const endDate = new Date(startDate);

    // If we have appointment duration from the type, use it, otherwise default to 1 hour
    const durationInHours = appointment.appointment_type?.duration
      ? appointment.appointment_type.duration / 60
      : 1;

    endDate.setHours(endDate.getHours() + durationInHours);

    return {
      id: appointment.id,
      title: appointment.client_name,
      start: startDate,
      end: endDate,
      status: appointment.status,
      resource: appointment,
      // Store the appointment type color for use in the eventPropGetter
      typeColor: appointment.appointment_type?.color || null,
      typeName: appointment.appointment_type?.name || "Appointment",
    };
  });

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    // Show a toast with appointment details
    toast({
      title: `Appointment with ${event.title}`,
      description: (
        <div className="space-y-1">
          <div>{format(event.start, "PPP 'at' p")}</div>
          <div className="flex items-center gap-2">
            <span>Type: {event.typeName}</span>
            {event.typeColor && (
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: event.typeColor }}
              />
            )}
          </div>
          <div>Status: {event.status}</div>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                setAppointmentToDelete(event.resource);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      ),
    });
  }, [toast, setAppointmentToDelete, setIsDeleteDialogOpen]);

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

  // Custom event component to show status and type
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="flex flex-col h-full">
      <div className="text-sm font-medium">{event.title}</div>
      <div className="text-xs mt-1 flex items-center gap-1">
        {format(event.start, "p")}
        {event.typeColor && (
          <div className="flex items-center gap-1 ml-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: event.typeColor }}
            />
            <span className="text-xs opacity-90">{event.typeName}</span>
          </div>
        )}
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
          // Use appointment type color if available, otherwise use status-based colors
          let backgroundColor = event.typeColor || null;

          // If no type color, fall back to status-based colors
          if (!backgroundColor) {
            backgroundColor =
              event.status === "scheduled" ? "#6366f1" :
              event.status === "completed" ? "#10b981" :
              event.status === "cancelled" ? "#ef4444" :
              "#6b7280";
          }

          // For cancelled appointments, add a strikethrough effect
          const textDecoration = event.status === "cancelled" ? "line-through" : "none";

          // Adjust opacity based on status
          const opacity = event.status === "cancelled" ? 0.6 :
                         event.status === "completed" ? 0.75 : 0.85;

          return {
            style: {
              backgroundColor,
              borderRadius: "4px",
              opacity,
              color: "#fff",
              border: "0px",
              display: "block",
              padding: "4px",
              height: "100%",
              textDecoration,
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

      {/* Delete Appointment Dialog */}
      <DeleteAppointmentDialog
        appointment={appointmentToDelete}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDeleteSuccess={() => {
          // We don't need to update the local state here as the page will refresh
          // when navigating back to it, fetching the latest data from the server
          window.location.reload();
        }}
      />
    </>
  );
}
