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
  FileText
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  // Update status when appointment changes
  useEffect(() => {
    if (appointment) {
      setStatus(appointment.status);
    }
  }, [appointment]);

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

  // Format date for display
  const appointmentDate = new Date(appointment.date);
  const formattedDate = format(appointmentDate, "PPPP");
  const formattedTime = format(appointmentDate, "p");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center text-xl font-bold">
            <User className="h-5 w-5 mr-2 text-primary" />
            {appointment.client_name}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Appointment details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Appointment details card */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              Appointment Details
            </h3>

            <div className="space-y-3">
              {/* Type */}
              <div className="flex items-center">
                <Tag className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm font-medium w-16">Type:</span>
                <div className="flex items-center">
                  {appointment.appointment_type?.color && (
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: appointment.appointment_type.color }}
                    />
                  )}
                  <span className="text-sm">{appointment.appointment_type?.name || "Not specified"}</span>
                </div>
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
              {appointment.client_email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm font-medium w-16">Email:</span>
                  <a
                    href={`mailto:${appointment.client_email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {appointment.client_email}
                  </a>
                </div>
              )}

              {appointment.client_phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm font-medium w-16">Phone:</span>
                  <a
                    href={`tel:${appointment.client_phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {appointment.client_phone}
                  </a>
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
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue>
                      <div className="flex items-center">
                        <Badge
                          variant={
                            status === "scheduled" ? "default" :
                            status === "completed" ? "success" :
                            status === "cancelled" ? "destructive" :
                            "outline"
                          }
                        >
                          {status}
                        </Badge>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">scheduled</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <Badge variant="success">completed</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">cancelled</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes if available */}
          {appointment.notes && (
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-primary" />
                Notes
              </h3>
              <p className="text-sm whitespace-pre-wrap pl-6">{appointment.notes}</p>
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
