"use client";

import { useState } from "react";
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
  CheckCircle2, 
  XCircle, 
  Edit, 
  Trash2,
  Share
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
import { Separator } from "@/components/ui/separator";
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
}

export function AppointmentDetailsDialog({
  appointment,
  isOpen,
  onOpenChange,
  onDelete,
  onShare
}: AppointmentDetailsDialogProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [status, setStatus] = useState<string>(appointment?.status || "scheduled");
  const [isUpdating, setIsUpdating] = useState(false);

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
          <DialogTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {appointment.client_name}
          </DialogTitle>
          <DialogDescription>
            Appointment details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Appointment type */}
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Type:</span>
            <div className="flex items-center">
              {appointment.appointment_type?.color && (
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: appointment.appointment_type.color }}
                />
              )}
              <span>{appointment.appointment_type?.name || "Not specified"}</span>
            </div>
          </div>

          {/* Date and time */}
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm font-medium">Date:</span>
              <div className="text-sm">{formattedDate}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Time:</span>
            <span>{formattedTime}</span>
            {appointment.appointment_type?.duration && (
              <span className="text-muted-foreground text-sm">
                ({appointment.appointment_type.duration} minutes)
              </span>
            )}
          </div>

          {/* Contact information */}
          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Contact Information</h3>
            
            {appointment.client_email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`mailto:${appointment.client_email}`} 
                  className="text-sm text-primary hover:underline"
                >
                  {appointment.client_email}
                </a>
              </div>
            )}
            
            {appointment.client_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`tel:${appointment.client_phone}`} 
                  className="text-sm text-primary hover:underline"
                >
                  {appointment.client_phone}
                </a>
              </div>
            )}
          </div>

          {/* Status */}
          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Status</h3>
            <div className="flex items-center gap-2">
              <Select
                value={status}
                onValueChange={handleStatusChange}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue>
                    <div className="flex items-center gap-2">
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

          {/* Notes if available */}
          {appointment.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
          <div className="flex gap-2">
            {onShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
              >
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
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
