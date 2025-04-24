"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Database } from "@/types/supabase";
import { Button } from "@/components/ui/button";

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
}

export function DeleteAppointmentTypeDialog({
  appointmentType,
  isOpen,
  onOpenChange,
  onDeleteSuccess,
}: DeleteAppointmentTypeDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);

  // Fetch all appointment types for reassignment
  useEffect(() => {
    const fetchAppointmentTypes = async () => {
      if (!appointmentType || !isOpen) return;

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
      }
    };

    fetchAppointmentTypes();
  }, [supabase, appointmentType, isOpen]);

  // Perform the actual deletion
  const performDelete = async () => {
    if (!appointmentType) return false;

    try {
      // Delete form settings associated with this type
      const { error: formSettingsError } = await supabase
        .from("form_settings_per_type")
        .delete()
        .eq("appointment_type_id", appointmentType.id);

      if (formSettingsError) {
        console.error("Error deleting form settings:", formSettingsError);
        // Continue anyway
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
      return true;
    } catch (err) {
      console.error("Error deleting appointment type:", err);
      toast({
        title: "Error",
        description: "Could not delete appointment type. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!appointmentType) return;

    setIsDeleting(true);
    try {
      // Check if this is the default type and not the only type
      if (appointmentType.is_default && appointmentTypes.length > 1) {
        console.log("Cannot delete default type when there are multiple types");
        toast({
          title: "Cannot delete default type",
          description: "Please set another type as default before deleting this one.",
          variant: "destructive",
        });
        setIsDeleting(false);
        onOpenChange(false);
        return;
      }

      // Check if this type is used by any appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, client_name, date")
        .eq("appointment_type_id", appointmentType.id);

      if (appointmentsError) {
        console.error("Error checking appointments:", appointmentsError);
        setIsDeleting(false);
        return;
      }

      if (appointmentsData && appointmentsData.length > 0) {
        // Check if we have a lot of appointments - if so, offer a direct link instead of showing them all
        if (appointmentsData.length > 10) {
          toast({
            title: "Multiple appointments found",
            description: (
              <div className="space-y-2">
                <p>This appointment type is used by {appointmentsData.length} appointments.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Examples: {appointmentsData.slice(0, 3).map(app =>
                    `${app.client_name} (${new Date(app.date).toLocaleDateString()})`
                  ).join(", ")}
                  {appointmentsData.length > 3 ? ` and ${appointmentsData.length - 3} more...` : ""}
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white text-destructive hover:bg-gray-100 border border-destructive/20 font-medium"
                    onClick={() => {
                      router.push(`/dashboard/appointments?type=${appointmentType.id}`);
                      onOpenChange(false);
                    }}
                  >
                    View All Appointments
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white text-primary hover:bg-gray-100 border border-primary/20 font-medium"
                    onClick={() => {
                      toast({
                        title: "Reassign appointments first",
                        description: "Please reassign these appointments to another type before deleting this one.",
                        variant: "destructive",
                      });
                      onOpenChange(false);
                    }}
                  >
                    Reassign & Delete
                  </Button>
                </div>
              </div>
            ),
            variant: "destructive",
          });
          setIsDeleting(false);
          onOpenChange(false);
          return;
        }

        // For fewer appointments, show a warning with details
        toast({
          title: "Appointments found",
          description: (
            <div>
              <p>This appointment type is used by {appointmentsData.length} appointments. Please reassign them first.</p>
              <p className="text-sm text-muted-foreground mt-1">
                {appointmentsData.map(app =>
                  `${app.client_name} (${new Date(app.date).toLocaleDateString()})`
                ).join(", ")}
              </p>
            </div>
          ),
          variant: "destructive",
        });
        setIsDeleting(false);
        onOpenChange(false);
        return;
      }

      // Now that we've confirmed it's safe to delete, proceed with deletion
      await performDelete();
    } catch (err) {
      console.error("Error in handleDelete:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
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
