"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { Database } from "@/types/supabase";
import { useTranslations, useLocale } from "next-intl";
import { useDateFormatter } from "@/hooks/use-date-formatter";

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
  const t = useTranslations();
  const locale = useLocale();
  const { formatDate, formatTime } = useDateFormatter();

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
        title: t('appointments.deleteSuccess'),
        description: t('appointments.deleteSuccessDescription'),
      });

      // Call the success callback to update the UI
      onDeleteSuccess();
    } catch (err: any) {
      console.error("Error deleting appointment:", err);
      toast({
        title: t('common.errorLabel'),
        description: err?.message || t('appointments.deleteError'),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-4 sm:p-6 max-w-[90vw] sm:max-w-md">
        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle className="text-lg sm:text-xl flex items-center justify-center sm:justify-start text-destructive">
            {t('appointments.delete')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs sm:text-sm">
            {t('appointments.deleteConfirm')} {t('common.cannotBeUndone')}
            {appointment && (
              <div className="mt-2 p-2 sm:p-3 bg-muted rounded-md shadow-sm">
                <p className="font-medium text-sm sm:text-base truncate flex items-center">
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-destructive" />
                  {appointment.client_name}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground pl-5 sm:pl-6">
                  {appointment.date && (
                    <>
                      {formatDate(new Date(appointment.date))} • {formatTime(new Date(appointment.date))}
                    </>
                  )}
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 mt-4">
          <AlertDialogCancel
            disabled={isDeleting}
            className="mt-2 sm:mt-0 text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-auto"
          >
            {t('common.cancelButton')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-auto font-medium"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                {t('common.deleting')}
              </>
            ) : (
              t('common.delete')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
