"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarClock, MoreHorizontal, Search, Share, Copy, Check, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// No longer need supabase client as we're using the API endpoint
import { Database } from "@/types/supabase";
import { DeleteAppointmentDialog } from "./delete-appointment-dialog";
import { AppointmentDetailsDialog } from "./appointment-details-dialog";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="space-y-4">
      {/* Active filters display */}
      {(activeTypeId || activeFieldName) && (
        <div className="bg-muted/50 p-3 rounded-md flex items-center justify-between">
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
              // Use client-side navigation to clear filters
              window.location.href = '/dashboard/appointments';
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
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
              <Button variant="outline">
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointmentsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No appointments found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointmentsList.map((appointment) => (
                <TableRow
                  key={appointment.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setIsDetailsDialogOpen(true);
                  }}
                >
                  <TableCell className="font-medium">
                    {appointment.client_name}
                  </TableCell>
                  <TableCell>
                    {format(new Date(appointment.date), "PPP p")}
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
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: appointment.appointment_type.color }}
                          />
                        )}
                        <span className="text-sm">{appointment.appointment_type.name}</span>
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
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(appointment);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
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
                          <Share className="mr-2 h-4 w-4" />
                          Share with client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAppointmentToDelete(appointment);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete appointment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Appointment</DialogTitle>
            <DialogDescription>
              Share this link with your client to let them view their appointment details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <label htmlFor="link" className="sr-only">
                  Link
                </label>
                <Input
                  id="link"
                  value={currentAppointment && currentAppointment.share_token ?
                    `${window.location.origin}/appointment/${currentAppointment.share_token}` :
                    'No share link available'}
                  readOnly
                />
              </div>
              <Button
                size="icon"
                onClick={async () => {
                  if (currentAppointment && currentAppointment.share_token) {
                    // We already have a valid share token, just copy it
                    const link = `${window.location.origin}/appointment/${currentAppointment.share_token}`;
                    navigator.clipboard.writeText(link);
                    setCopied(true);
                    toast({
                      title: "Link copied",
                      description: "The appointment link has been copied to your clipboard.",
                    });
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
              >
                {isGeneratingToken ? <Loader2 className="h-4 w-4 animate-spin" /> :
                 copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-col space-y-2">
              <h3 className="text-sm font-medium">Appointment for</h3>
              <p className="text-sm">{currentAppointment?.client_name}</p>
              <p className="text-xs text-muted-foreground">
                {currentAppointment ? format(new Date(currentAppointment.date), "PPP p") : ''}
              </p>
            </div>
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
