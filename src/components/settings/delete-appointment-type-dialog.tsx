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

type AppointmentType = Database["public"]["Tables"]["appointment_types"]["Row"];

interface DeleteAppointmentTypeDialogProps {
  appointmentType: AppointmentType | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess: () => void;
  onCheckBeforeDelete?: (appointmentType: AppointmentType) => Promise<boolean>;
}

export function DeleteAppointmentTypeDialog({
  appointmentType,
  isOpen,
  onOpenChange,
  onDeleteSuccess,
  onCheckBeforeDelete,
}: DeleteAppointmentTypeDialogProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!appointmentType) return;

    setIsDeleting(true);
    try {
      // If there's a check function, run it first
      if (onCheckBeforeDelete) {
        const canProceed = await onCheckBeforeDelete(appointmentType);
        if (!canProceed) {
          setIsDeleting(false);
          return;
        }
      }

      // Delete custom fields associated with this type
      const { error: fieldsError } = await supabase
        .from("appointment_custom_fields")
        .delete()
        .eq("appointment_type_id", appointmentType.id);

      if (fieldsError) {
        console.error("Error deleting custom fields:", fieldsError);
        // Continue anyway
      }

      // Check if there are any appointment field values that reference custom fields for this type
      const { data: customFields } = await supabase
        .from("appointment_custom_fields")
        .select("id")
        .eq("appointment_type_id", appointmentType.id);

      if (customFields && customFields.length > 0) {
        const fieldIds = customFields.map(field => field.id);

        // Delete any field values that reference these custom fields
        if (fieldIds.length > 0) {
          const { error: fieldValuesError } = await supabase
            .from("appointment_field_values")
            .delete()
            .in("field_id", fieldIds);

          if (fieldValuesError) {
            console.error("Error deleting field values:", fieldValuesError);
          }
        }
      }

      // Delete the appointment type
      const { error } = await supabase
        .from("appointment_types")
        .delete()
        .eq("id", appointmentType.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Appointment type deleted",
        description: "The appointment type has been deleted successfully.",
      });

      onDeleteSuccess();
    } catch (err) {
      console.error("Error deleting appointment type:", err);
      toast({
        title: "Error",
        description: "Could not delete appointment type. Please try again.",
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
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the appointment type
            {appointmentType && <strong> "{appointmentType.name}"</strong>}.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
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
