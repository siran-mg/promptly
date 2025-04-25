"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  User,
  Tag,
  Trash2,
  Share,
  CheckCircle2,
  FileText,
  Edit,
  Save,
  X
} from "lucide-react";

import { Database } from "@/types/supabase";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppointmentTypeSelector } from "./appointment-type-selector";

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

interface AppointmentDetailsDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onShare?: () => void;
  onStatusChange?: (appointmentId: string, newStatus: string) => void;
}

export function AppointmentDetailsDialog({
  appointment,
  isOpen,
  onOpenChange,
  onDelete,
  onShare,
  onStatusChange
}: AppointmentDetailsDialogProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [status, setStatus] = useState<string>("scheduled");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [appointmentData, setAppointmentData] = useState<{
    client_name: string;
    client_email: string;
    client_phone: string;
    notes: string | null;
    appointment_type_id: string | null;
  }>({
    client_name: '',
    client_email: '',
    client_phone: '',
    notes: null,
    appointment_type_id: null
  });
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);

  // Update status and form data when appointment changes
  useEffect(() => {
    if (appointment) {
      setStatus(appointment.status);
      setAppointmentData({
        client_name: appointment.client_name,
        client_email: appointment.client_email || '',
        client_phone: appointment.client_phone || '',
        notes: appointment.notes,
        appointment_type_id: appointment.appointment_type_id
      });
    }
  }, [appointment]);

  // Fetch appointment types when in edit mode
  useEffect(() => {
    if (isEditMode && isOpen) {
      fetchAppointmentTypes();
    }
  }, [isEditMode, isOpen]);

  const fetchAppointmentTypes = async () => {
    if (!appointment) return;

    setIsLoadingTypes(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("appointment_types")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("name");

      if (error) {
        console.error("Error fetching appointment types:", error);
        return;
      }

      setAppointmentTypes(data || []);
    } catch (err) {
      console.error("Error fetching appointment types:", err);
    } finally {
      setIsLoadingTypes(false);
    }
  };

  if (!appointment) return null;

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointment.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Status updated",
        description: `Appointment status has been updated to ${newStatus}.`,
      });

      // Call the callback to update parent component state
      if (onStatusChange) {
        onStatusChange(appointment.id, newStatus);
      }
    } catch (err: any) {
      console.error("Error updating appointment status:", err);
      toast({
        title: "Error",
        description: err?.message || "Could not update appointment status. Please try again.",
        variant: "destructive",
      });
      // Revert to original status
      setStatus(appointment.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAppointmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAppointmentTypeChange = (typeId: string) => {
    setAppointmentData(prev => ({
      ...prev,
      appointment_type_id: typeId || null // Convert empty string to null
    }));
  };

  const handleSaveChanges = async () => {
    if (!appointment) return;

    setIsUpdating(true);

    try {
      // Prepare the data to update, ensuring appointment_type_id is null if it's an empty string
      const updateData = {
        client_name: appointmentData.client_name,
        client_email: appointmentData.client_email,
        client_phone: appointmentData.client_phone,
        notes: appointmentData.notes,
        appointment_type_id: appointmentData.appointment_type_id || null
      };

      console.log("Updating appointment with data:", updateData);

      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointment.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Appointment updated",
        description: "The appointment details have been updated successfully.",
      });

      // Exit edit mode
      setIsEditMode(false);

      // Update the local appointment object to reflect changes
      appointment.client_name = appointmentData.client_name;
      appointment.client_email = appointmentData.client_email;
      appointment.client_phone = appointmentData.client_phone;
      appointment.notes = appointmentData.notes;
      appointment.appointment_type_id = appointmentData.appointment_type_id || null;

      // If appointment type was removed, also remove the appointment_type object
      if (!appointment.appointment_type_id) {
        appointment.appointment_type = null;
      }

      // Call the callback to update parent component state
      if (onStatusChange) {
        // We're reusing the status change callback to trigger a refresh
        onStatusChange(appointment.id, status);
      }
    } catch (err: any) {
      console.error("Error updating appointment:", err);
      toast({
        title: "Error",
        description: err?.message || "Could not update appointment details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date for display
  const appointmentDate = new Date(appointment.date);
  const formattedDate = format(appointmentDate, "PPPP");
  const formattedTime = format(appointmentDate, "p");

  // Handle dialog close - reset edit mode
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset edit mode when closing
      setIsEditMode(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              <DialogTitle className="text-xl font-bold">
                {appointment.client_name}
              </DialogTitle>
            </div>

            {isEditMode && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setIsEditMode(false)}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-primary"
                  onClick={handleSaveChanges}
                  disabled={isUpdating}
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  Save
                </Button>
              </div>
            )}

            {!isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-primary"
                onClick={() => setIsEditMode(true)}
              >
                <Edit className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            )}
          </div>
          <DialogDescription className="text-center pt-2 pb-4">
            Appointment details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Appointment details card */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h3 className="text-sm font-medium flex items-center mb-3">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              Appointment Details
            </h3>

            <div className="space-y-3">
              {/* Type */}
              <div className="flex items-center">
                <Tag className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm font-medium w-16">Type:</span>

                {!isEditMode ? (
                  <div className="flex items-center">
                    {appointment.appointment_type?.color && (
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: appointment.appointment_type.color }}
                      />
                    )}
                    <span className="text-sm">
                      {appointment.appointment_type?.name ||
                       (appointment.appointment_type_id ? "Loading..." : "Not specified")}
                    </span>
                  </div>
                ) : (
                  <div className="flex-1">
                    <AppointmentTypeSelector
                      value={appointmentData.appointment_type_id || ''}
                      onChange={handleAppointmentTypeChange}
                      userId={appointment.user_id}
                    />
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm font-medium w-16">Date:</span>
                <span className="text-sm">{formattedDate}</span>
              </div>

              {/* Time */}
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm font-medium w-16">Time:</span>
                <span className="text-sm">{formattedTime}</span>
                {appointment.appointment_type?.duration && (
                  <span className="text-muted-foreground text-sm ml-1">
                    ({appointment.appointment_type.duration} minutes)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact information card */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <User className="h-4 w-4 mr-2 text-primary" />
              Contact Information
            </h3>

            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm font-medium w-16">Email:</span>

                {!isEditMode ? (
                  appointment.client_email ? (
                    <a
                      href={`mailto:${appointment.client_email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {appointment.client_email}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not provided</span>
                  )
                ) : (
                  <div className="flex-1">
                    <Input
                      name="client_email"
                      value={appointmentData.client_email}
                      onChange={handleInputChange}
                      placeholder="Email address"
                      className="h-8 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm font-medium w-16">Phone:</span>

                {!isEditMode ? (
                  appointment.client_phone ? (
                    <a
                      href={`tel:${appointment.client_phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {appointment.client_phone}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not provided</span>
                  )
                ) : (
                  <div className="flex-1">
                    <Input
                      name="client_phone"
                      value={appointmentData.client_phone}
                      onChange={handleInputChange}
                      placeholder="Phone number"
                      className="h-8 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Name - only in edit mode */}
              {isEditMode && (
                <div className="flex items-center">
                  <User className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm font-medium w-16">Name:</span>
                  <div className="flex-1">
                    <Input
                      name="client_name"
                      value={appointmentData.client_name}
                      onChange={handleInputChange}
                      placeholder="Client name"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status card */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
              Appointment Status
            </h3>

            <div className="flex items-center">
              <span className="text-sm font-medium w-16">Status:</span>
              <div className="flex-1">
                <Select
                  value={status}
                  onValueChange={handleStatusChange}
                  disabled={isUpdating || isEditMode}
                >
                  <SelectTrigger className="w-[140px] h-8 text-sm">
                    <SelectValue>
                      <Badge
                        variant={
                          status === "scheduled" ? "default" :
                          status === "completed" ? "success" :
                          status === "cancelled" ? "destructive" :
                          "outline"
                        }
                        className="font-normal"
                      >
                        {status}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">
                      <Badge variant="default" className="font-normal">scheduled</Badge>
                    </SelectItem>
                    <SelectItem value="completed">
                      <Badge variant="success" className="font-normal">completed</Badge>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <Badge variant="destructive" className="font-normal">cancelled</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes section - always show in edit mode */}
          {(appointment.notes || isEditMode) && (
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-primary" />
                Notes
              </h3>

              {!isEditMode ? (
                <p className="text-sm whitespace-pre-wrap pl-6">{appointment.notes}</p>
              ) : (
                <div className="pl-6">
                  <textarea
                    name="notes"
                    value={appointmentData.notes || ''}
                    onChange={handleInputChange}
                    placeholder="Add notes about this appointment..."
                    className="w-full min-h-[100px] text-sm p-2 rounded-md border border-input bg-background"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between mt-4">
          <Button
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Appointment
          </Button>

          <div className="flex gap-2">
            {onShare && (
              <Button
                variant="outline"
                onClick={onShare}
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
            <Button
              variant="default"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
