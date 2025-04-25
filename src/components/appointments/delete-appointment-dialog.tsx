"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Database } from "@/types/supabase";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface DeleteAppointmentDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess: () => void;
}

export function DeleteAppointmentDialog({
  appointment,
  isOpen,
  onOpenChange,
  onDeleteSuccess,
}: DeleteAppointmentDialogProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!appointment) return;

    setIsDeleting(true);
    try {
      // Delete appointment field values first (if any)
      const { error: fieldValuesError } = await supabase
        .from("appointment_field_values")
        .delete()
        .eq("appointment_id", appointment.id);

      if (fieldValuesError) {
        console.error("Error deleting appointment field values:", fieldValuesError);
        // Continue anyway
      }

      // Delete the appointment
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointment.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Appointment deleted",
        description: "The appointment has been successfully deleted.",
      });

      // Call the success callback to update the UI
      onDeleteSuccess();
    } catch (err: any) {
      console.error("Error deleting appointment:", err);
      toast({
        title: "Error",
        description: err?.message || "Could not delete appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this appointment? This action cannot be undone.
            {appointment && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="font-medium">{appointment.client_name}</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.date && new Date(appointment.date).toLocaleString()}
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t('common.cancelButton')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
