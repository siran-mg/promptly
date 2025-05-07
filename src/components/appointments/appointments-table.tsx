"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { useDateFormatter } from "@/hooks/use-date-formatter";
import { MoreHorizontal, Share, Loader2, Trash2, Eye, Copy, Check, CalendarClock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
// No longer need supabase client as we're using the API endpoint
import { Database } from "@/types/supabase";
import { DeleteAppointmentDialog } from "./delete-appointment-dialog";
import { AppointmentDetailsDialog } from "./appointment-details-dialog";
import { AppointmentFilterBar } from "./appointment-filter-bar";
import { NoMatchingAppointments } from "./no-matching-appointments";
import { EmptyAppointmentsState } from "./empty-appointments-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppointmentStatusBadge } from "./appointment-status-badge";

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

interface AppointmentsTableProps {
  appointments: Appointment[];
  appointmentTypes?: AppointmentType[];
  activeTypeId?: string;
  activeFieldName?: string;
}

export function AppointmentsTable({
  appointments,
  appointmentTypes = [],
  activeTypeId,
  activeFieldName
}: AppointmentsTableProps) {
  const { toast } = useToast();
  const currentLocale = useLocale();
  const { formatDate, formatTime } = useDateFormatter();
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [filteredAppointmentsList, setFilteredAppointmentsList] = useState<Appointment[]>([]);

  // Get the date-fns locale object based on the current locale
  const dateLocale = currentLocale === 'fr' ? fr : enUS;

  // Filter appointments based on search query and update state
  useEffect(() => {
    const filtered = appointments.filter((appointment) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        appointment.client_name.toLowerCase().includes(searchLower) ||
        appointment.client_email.toLowerCase().includes(searchLower) ||
        appointment.client_phone.toLowerCase().includes(searchLower) ||
        appointment.status.toLowerCase().includes(searchLower)
      );
    });
    setFilteredAppointmentsList(filtered);
  }, [appointments, searchQuery]);

  // Only show filter bar if there are appointments or active filters
  return (
    <div className="space-y-4">
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
      ) : filteredAppointmentsList.length === 0 ? (
        // Appointments exist but none match the filter - show no matching message
        <NoMatchingAppointments />
      ) : (
        // Show appointments table or cards based on screen size
        <>
          {/* Desktop Table View - Hidden on Mobile */}
          <div className="rounded-md border border-indigo-100 overflow-hidden shadow-sm hidden md:block">
            <Table>
              <TableHeader className="bg-indigo-50">
              <TableRow>
                <TableHead className="text-indigo-700 font-semibold">Client</TableHead>
                <TableHead className="text-indigo-700 font-semibold">Date & Time</TableHead>
                <TableHead className="text-indigo-700 font-semibold">Contact</TableHead>
                <TableHead className="text-indigo-700 font-semibold">Type</TableHead>
                <TableHead className="text-indigo-700 font-semibold">Status</TableHead>
                <TableHead className="text-indigo-700 font-semibold w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {filteredAppointmentsList.map((appointment) => (
                <TableRow
                  key={appointment.id}
                  className="cursor-pointer hover:bg-indigo-50/30 transition-colors"
                  onClick={(e) => {
                    // Only open details dialog if the click is not on a dropdown menu item
                    if (e.defaultPrevented) return;
                    setSelectedAppointment(appointment);
                    setIsDetailsDialogOpen(true);
                  }}
                >
                  <TableCell className="font-medium">
                    {appointment.client_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-indigo-700">
                        {currentLocale === 'fr'
                          ? format(new Date(appointment.date), "EEE d MMM", { locale: dateLocale })
                          : format(new Date(appointment.date), "EEE, MMM d", { locale: dateLocale })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(new Date(appointment.date))}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{appointment.client_email}</span>
                      <span className="text-xs text-muted-foreground">{appointment.client_phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {appointment.appointment_type ? (
                      <div className="flex items-center">
                        {appointment.appointment_type.color && (
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: appointment.appointment_type.color }}
                          />
                        )}
                        <span className="text-sm font-medium">{appointment.appointment_type.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not specified</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <AppointmentStatusBadge status={appointment.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-indigo-100 hover:text-indigo-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="text-indigo-700">{t('clients.actions.title')}</DropdownMenuLabel>
                        <DropdownMenuItem
                          className="hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setSelectedAppointment(appointment);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4 text-indigo-600" />
                          {t('appointments.details')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                          onClick={async (e) => {
                            // Stop propagation and prevent default to prevent the row click from opening the details dialog
                            e.stopPropagation();
                            e.preventDefault();
                            // First, check if the appointment has a share token
                            if (!appointment.share_token) {
                              // Generate a share token before opening the dialog
                              setIsGeneratingToken(true);
                              try {
                                // Use the server-side API to generate a share token
                                const response = await fetch('/api/appointments/share-token', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ appointmentId: appointment.id }),
                                });

                                const result = await response.json();

                                if (!response.ok) {
                                  console.error('API error:', result.error);
                                  toast({
                                    title: 'Error',
                                    description: result.error || 'Could not generate share link. Please try again.',
                                    variant: 'destructive',
                                  });
                                  setIsGeneratingToken(false);
                                  return;
                                }

                                console.log('Share token generated successfully:', result.appointment);

                                // Set the updated appointment with the share token
                                if (result.appointment) {
                                  setCurrentAppointment(result.appointment);
                                  setShareDialogOpen(true);
                                  setCopied(false);
                                } else {
                                  console.error('No appointment data returned from API');
                                  toast({
                                    title: 'Error',
                                    description: 'Could not retrieve updated appointment data.',
                                    variant: 'destructive',
                                  });
                                }
                              } catch (err) {
                                console.error('Error calling share token API:', err);
                                toast({
                                  title: 'Error',
                                  description: 'An unexpected error occurred. Please try again.',
                                  variant: 'destructive',
                                });
                              } finally {
                                setIsGeneratingToken(false);
                              }
                            } else {
                              // If share token already exists, just open the dialog
                              setCurrentAppointment(appointment);
                              setShareDialogOpen(true);
                              setCopied(false);
                            }
                          }}
                        >
                          <Share className="mr-2 h-4 w-4 text-green-600" />
                          {t('common.share')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setAppointmentToDelete(appointment);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('appointments.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
            </Table>
          </div>

          {/* Mobile Card View - Visible only on Mobile */}
          <div className="space-y-3 md:hidden">
            {filteredAppointmentsList.map((appointment) => (
              <div
                key={appointment.id}
                className="border border-indigo-100 rounded-md p-3 shadow-sm hover:bg-indigo-50/30 transition-colors cursor-pointer"
                onClick={(e) => {
                  // Only open details dialog if the click is not on a dropdown menu item
                  if (e.defaultPrevented) return;
                  setSelectedAppointment(appointment);
                  setIsDetailsDialogOpen(true);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium truncate mr-2">{appointment.client_name}</div>
                  <div className="flex items-center">
                    <AppointmentStatusBadge status={appointment.status} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 ml-1 hover:bg-indigo-100 hover:text-indigo-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="text-indigo-700">{t('clients.actions.title')}</DropdownMenuLabel>
                        <DropdownMenuItem
                          className="hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setSelectedAppointment(appointment);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4 text-indigo-600" />
                          {t('appointments.details')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (!appointment.share_token) {
                              setIsGeneratingToken(true);
                              try {
                                const response = await fetch('/api/appointments/share-token', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ appointmentId: appointment.id }),
                                });

                                const result = await response.json();

                                if (!response.ok) {
                                  console.error('API error:', result.error);
                                  toast({
                                    title: 'Error',
                                    description: result.error || 'Could not generate share link. Please try again.',
                                    variant: 'destructive',
                                  });
                                  setIsGeneratingToken(false);
                                  return;
                                }

                                if (result.appointment) {
                                  setCurrentAppointment(result.appointment);
                                  setShareDialogOpen(true);
                                  setCopied(false);
                                } else {
                                  toast({
                                    title: 'Error',
                                    description: 'Could not retrieve updated appointment data.',
                                    variant: 'destructive',
                                  });
                                }
                              } catch (err) {
                                toast({
                                  title: 'Error',
                                  description: 'An unexpected error occurred. Please try again.',
                                  variant: 'destructive',
                                });
                              } finally {
                                setIsGeneratingToken(false);
                              }
                            } else {
                              setCurrentAppointment(appointment);
                              setShareDialogOpen(true);
                              setCopied(false);
                            }
                          }}
                        >
                          <Share className="mr-2 h-4 w-4 text-green-600" />
                          {t('common.share')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setAppointmentToDelete(appointment);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('appointments.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex items-center text-sm mb-2">
                  <CalendarClock className="h-3.5 w-3.5 text-indigo-600 mr-1.5" />
                  <span className="font-medium text-indigo-700">
                    {currentLocale === 'fr'
                      ? format(new Date(appointment.date), "EEE d MMM", { locale: dateLocale })
                      : format(new Date(appointment.date), "EEE, MMM d", { locale: dateLocale })}
                  </span>
                  <span className="mx-1">•</span>
                  <span className="text-muted-foreground">
                    {formatTime(new Date(appointment.date))}
                  </span>
                </div>

                {appointment.appointment_type && (
                  <div className="flex items-center text-xs mb-2">
                    {appointment.appointment_type.color && (
                      <div
                        className="w-2.5 h-2.5 rounded-full mr-1.5"
                        style={{ backgroundColor: appointment.appointment_type.color }}
                      />
                    )}
                    <span className="text-muted-foreground">{appointment.appointment_type.name}</span>
                  </div>
                )}

                <div className="text-xs text-muted-foreground truncate">
                  {appointment.client_email}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md p-4 sm:p-6 max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl flex items-center justify-center text-primary">
              <Share className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
              <span className="text-base sm:text-lg">{t('settings.formSettingsSection.shareBookingLink')}</span>
            </DialogTitle>
            <DialogDescription className="text-center text-xs sm:text-sm">
              {t('settings.formSettingsSection.shareWithClients')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 pt-3 sm:pt-4">
            <div className="grid flex-1 gap-2">
              <Input
                id="link"
                value={currentAppointment && currentAppointment.share_token ?
                  `${window.location.origin}/appointment/${currentAppointment.share_token}` :
                  t('common.notProvided')}
                readOnly
                className="border-primary/20 focus-visible:ring-primary/30 text-xs sm:text-sm h-8 sm:h-9"
              />
            </div>
            <Button
              size="icon"
              className={`h-8 w-8 sm:h-9 sm:w-9 ${copied ? "bg-green-600 hover:bg-green-700" : ""}`}
              onClick={async () => {
                if (currentAppointment && currentAppointment.share_token) {
                  // Copy the link to clipboard
                  const link = `${window.location.origin}/appointment/${currentAppointment.share_token}`;
                  navigator.clipboard.writeText(link);
                  setCopied(true);
                  toast({
                    title: t('common.copied'),
                    description: t('settings.formSettingsSection.linkCopiedDescription'),
                  });
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
            >
              {isGeneratingToken ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> :
               copied ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </Button>
          </div>
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
        onShare={() => {
          if (selectedAppointment) {
            setCurrentAppointment(selectedAppointment);
            setIsDetailsDialogOpen(false);
            setShareDialogOpen(true);
            setCopied(false);
          }
        }}
        onStatusChange={(appointmentId, newStatus) => {
          // Update the filtered appointments to reflect the change
          const updatedFilteredAppointments = filteredAppointmentsList.map(appointment => {
            if (appointment.id === appointmentId) {
              return {
                ...appointment,
                status: newStatus
              };
            }
            return appointment;
          });

          // Force a re-render by updating the filtered appointments array
          setFilteredAppointmentsList([...updatedFilteredAppointments]);
        }}
      />
    </div>
  );
}
