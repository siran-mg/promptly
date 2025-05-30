"use client";

import { useState, useCallback, useEffect } from "react";
import { Calendar, Views, SlotInfo } from "react-big-calendar";
import { dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import fr from "date-fns/locale/fr";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Database } from "@/types/supabase";
import { Plus, CalendarClock, Calendar as CalendarIcon } from "lucide-react";
import { DeleteAppointmentDialog } from "./delete-appointment-dialog";
import { AppointmentDetailsDialog } from "./appointment-details-dialog";
import { SimpleDatePicker } from "./simple-date-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EmptyAppointmentsState } from "./empty-appointments-state";

// Import the CSS for react-big-calendar
import "react-big-calendar/lib/css/react-big-calendar.css";

// Add custom styles for the calendar
import "@/styles/calendar.css";

// Import our custom overrides for day names
import "./calendar-overrides.css";

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

export function AppointmentsCalendar({ appointments }: AppointmentsCalendarProps) {
  const router = useRouter();
  const currentLocale = useLocale();
  const t = useTranslations();
  const [view, setView] = useState<string>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Set up locales for the calendar
  const locales = {
    "en": enUS,
    "fr": fr,
  };

  // Create the localizer with the current locale
  const currentDateFnsLocale = locales[currentLocale as "en" | "fr"] || enUS;

  // Create a properly configured localizer that respects the current locale
  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date: Date) => {
      // For French locale, explicitly set weekStartsOn to 1 (Monday)
      return startOfWeek(date, {
        locale: currentDateFnsLocale,
        weekStartsOn: currentLocale === 'fr' ? 1 : 0 // 0 for Sunday (default), 1 for Monday
      });
    },
    getDay,
    locales: {
      // The key doesn't matter as long as we use the correct locale object
      "current": currentDateFnsLocale,
    },
  });

  // Initialize calendar events from appointments
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Update events when appointments change
  useEffect(() => {
    const mappedEvents = appointments.map((appointment) => {
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

    setEvents(mappedEvents);
  }, [appointments]);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    // Open the details dialog instead of showing a toast
    setSelectedAppointment(event.resource);
    setIsDetailsDialogOpen(true);
  }, []);

  // Handle slot selection (clicking on a date)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo.start);
    setIsCreateDialogOpen(true);
  }, []);

  // Navigate to new appointment page with pre-filled date
  const handleCreateAppointment = useCallback(() => {
    if (selectedSlot) {
      const formattedDate = format(selectedSlot, "yyyy-MM-dd'T'HH:mm");
      router.push(`/dashboard/appointments/new?date=${encodeURIComponent(formattedDate)}`);
    }
    setIsCreateDialogOpen(false);
  }, [selectedSlot, router]);

  // Empty state is handled in the parent component

  // We're using CSS to handle day name translations and date-fns for month names

  // Custom event component to show status and type
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    // Determine if this is a small event (less than 30 minutes or on month view)
    const isSmallEvent = view === 'month' ||
      (new Date(event.end).getTime() - new Date(event.start).getTime()) < 30 * 60 * 1000;

    return (
      <div className="flex flex-col h-full">
        <div className="text-xs md:text-sm font-semibold text-white truncate">{event.title}</div>
        {!isSmallEvent && (
          <div className="text-[10px] md:text-xs mt-1 flex items-center gap-1 text-white/90">
            <span className="font-medium">
              {format(
                event.start,
                currentLocale === "fr" ? "HH:mm" : "h:mm a",
                { locale: currentDateFnsLocale }
              )}
            </span>
            {event.typeColor && (
              <div className="flex items-center gap-1 ml-1">
                <div
                  className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-white/30"
                />
                <span className="text-[10px] md:text-xs font-medium truncate">{event.typeName}</span>
              </div>
            )}
          </div>
        )}
        {!isSmallEvent && (
          <div className="mt-auto pt-1">
            <div
              className={`text-[10px] md:text-xs font-medium px-1 md:px-1.5 py-0.5 rounded-sm inline-flex items-center ${
                event.status === "scheduled" ? "bg-white/20 text-white" :
                event.status === "completed" ? "bg-emerald-200 text-emerald-800" :
                event.status === "cancelled" ? "bg-red-200 text-red-800" :
                "bg-white/20 text-white"
              }`}
            >
              <span className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full mr-0.5 md:mr-1 ${
                event.status === "scheduled" ? "bg-white" :
                event.status === "completed" ? "bg-emerald-500" :
                event.status === "cancelled" ? "bg-red-500" :
                "bg-white"
              }`}></span>
              {event.status === "scheduled" ? t('appointments.upcoming') :
              event.status === "completed" ? t('appointments.completed') :
              event.status === "cancelled" ? t('appointments.cancelled') :
              event.status}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-2 md:space-y-3">
        <div className="flex items-center text-xs md:text-sm bg-indigo-50 p-2 md:p-3 rounded-md border border-indigo-100">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-indigo-600 flex items-center justify-center">
              <Plus className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
            </div>
            <span className="text-indigo-700 font-medium text-xs md:text-sm">{t('appointments.newAppointment.click')}</span>
          </div>
        </div>
        <div className="h-[500px] md:h-[700px] bg-white rounded-md overflow-hidden">
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
            scrollToTime={new Date(new Date().setHours(new Date().getHours(), 0, 0, 0))}
            formats={{
              // Custom time format
              timeGutterFormat: (date: Date) =>
                format(date, currentLocale === 'fr' ? 'HH:mm' : 'h:mm a', { locale: currentDateFnsLocale }),
            }}
            components={{
              event: EventComponent,
              toolbar: (toolbarProps) => {
                const viewNames = ['month', 'week', 'day'] as const;
                return (
                  <div className="rbc-toolbar flex flex-col md:flex-row gap-2 md:gap-0">
                    <span className="rbc-btn-group flex">
                      <button
                        type="button"
                        onClick={() => toolbarProps.onNavigate('TODAY')}
                        className="text-xs md:text-sm py-1 md:py-1.5"
                      >
                        {t('appointments.newAppointment.today')}
                      </button>
                      <button
                        type="button"
                        onClick={() => toolbarProps.onNavigate('PREV')}
                        className="text-xs md:text-sm py-1 md:py-1.5"
                      >
                        <span className="mr-1">←</span> {t('appointments.newAppointment.prev')}
                      </button>
                      <button
                        type="button"
                        onClick={() => toolbarProps.onNavigate('NEXT')}
                        className="text-xs md:text-sm py-1 md:py-1.5"
                      >
                        {t('appointments.newAppointment.next')} <span className="ml-1">→</span>
                      </button>
                    </span>
                    <span className="rbc-toolbar-label order-first md:order-none">
                      <Popover>
                        <PopoverTrigger asChild>
                          <div className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-md hover:bg-indigo-50 cursor-pointer transition-colors">
                            <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-600 flex-shrink-0" />
                            <span className="font-semibold text-indigo-700 text-xs md:text-sm truncate">
                              {format(
                                toolbarProps.date,
                                view === 'month' ? 'MMMM yyyy' :
                                view === 'week' ?
                                  (currentLocale === 'fr' ? "'Semaine du' d MMM yyyy" : "'Week of' MMM d, yyyy") :
                                currentLocale === 'fr' ? 'EEEE d MMM yyyy' : 'EEE, MMM d, yyyy',
                                { locale: currentDateFnsLocale }
                              )}
                            </span>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center" sideOffset={4}>
                          <SimpleDatePicker
                            selected={toolbarProps.date}
                            onSelect={(date: Date) => toolbarProps.onNavigate('DATE', date)}
                            className="rounded-md border"
                          />
                        </PopoverContent>
                      </Popover>
                    </span>
                    <span className="rbc-btn-group flex">
                      {viewNames.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toolbarProps.onView(name)}
                          className={`text-xs md:text-sm py-1 md:py-1.5 ${view === name ? 'rbc-active' : ''}`}
                        >
                          {name === 'month' ? t('appointments.month') :
                           name === 'week' ? t('appointments.week') :
                           name === 'day' ? t('appointments.day') :
                           String(name).charAt(0).toUpperCase() + String(name).slice(1)}
                        </button>
                      ))}
                    </span>
                  </div>
                );
              }
            }}
        eventPropGetter={(event) => {
          // Use appointment type color if available, otherwise use status-based colors
          let backgroundColor = event.typeColor || null;

          // If no type color, fall back to status-based colors
          if (!backgroundColor) {
            backgroundColor =
              event.status === "scheduled" ? "#4f46e5" :
              event.status === "completed" ? "#10b981" :
              event.status === "cancelled" ? "#ef4444" :
              "#6b7280";
          }

          // For cancelled appointments, add a strikethrough effect
          const textDecoration = event.status === "cancelled" ? "line-through" : "none";

          // Adjust opacity based on status
          const opacity = event.status === "cancelled" ? 0.7 :
                         event.status === "completed" ? 0.85 : 1;

          return {
            style: {
              backgroundColor,
              borderRadius: "6px",
              opacity,
              color: "#fff",
              border: "0px",
              display: "block",
              padding: "6px",
              height: "100%",
              textDecoration,
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            },
            className: "hover:translate-y-[-1px] hover:shadow-md"
          };
        }}
      />
        </div>
      </div>

      {/* Create Appointment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="bg-indigo-100 p-2 rounded-full">
                <CalendarClock className="h-5 w-5 text-indigo-600" />
              </div>
              {t('appointments.newAppointment.title')}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {selectedSlot && (
                <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100 mt-2 text-center">
                  <span className="text-indigo-700 font-medium">
                    {format(
                      selectedSlot,
                      currentLocale === "fr" ? "EEEE d MMMM yyyy" : "EEEE, MMMM d, yyyy",
                      { locale: currentDateFnsLocale }
                    )} {t('appointments.newAppointment.at')} {format(
                      selectedSlot,
                      currentLocale === "fr" ? "HH:mm" : "h:mm a",
                      { locale: currentDateFnsLocale }
                    )}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {t('appointments.newAppointment.description')}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateAppointment}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('appointments.newAppointment.continue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onDelete={() => {
          // Set the appointment to delete and open the delete dialog
          setAppointmentToDelete(selectedAppointment);
          setIsDetailsDialogOpen(false);
          setIsDeleteDialogOpen(true);
        }}
        onStatusChange={(appointmentId, newStatus) => {
          // Update the local state to reflect the status change
          const updatedEvents = events.map(event => {
            if (event.id === appointmentId) {
              return {
                ...event,
                status: newStatus,
                resource: {
                  ...event.resource,
                  status: newStatus
                }
              };
            }
            return event;
          });

          // Force a re-render by updating the events array
          setEvents([...updatedEvents]);
        }}
      />

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
