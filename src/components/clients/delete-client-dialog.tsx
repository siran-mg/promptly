"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

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

// Define a client type based on appointments
type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  appointmentsCount: number;
  lastAppointment: string | null;
};

interface DeleteClientDialogProps {
  client: Client | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess: () => void;
}

export function DeleteClientDialog({
  client,
  isOpen,
  onOpenChange,
  onDeleteSuccess,
}: DeleteClientDialogProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations();

  const handleDelete = async () => {
    if (!client) return;

    setIsDeleting(true);
    try {
      // Find all appointments for this client
      const { data: appointments, error: fetchError } = await supabase
        .from("appointments")
        .select("id")
        .eq("client_email", client.email)
        .eq("client_phone", client.phone);

      if (fetchError) {
        throw fetchError;
      }

      if (appointments && appointments.length > 0) {
        // Delete appointment field values first
        const appointmentIds = appointments.map(app => app.id);

        // Delete field values for these appointments
        const { error: fieldValuesError } = await supabase
          .from("appointment_field_values")
          .delete()
          .in("appointment_id", appointmentIds);

        if (fieldValuesError) {
          console.error("Error deleting appointment field values:", fieldValuesError);
          // Continue anyway
        }

        // Delete the appointments
        const { error: appointmentsError } = await supabase
          .from("appointments")
          .delete()
          .in("id", appointmentIds);

        if (appointmentsError) {
          throw appointmentsError;
        }
      }

      toast({
        title: t('clients.delete.success'),
        description: t('clients.delete.successDescription', { name: client.name }),
      });

      // Call the success callback to update the UI
      onDeleteSuccess();
    } catch (err: any) {
      console.error("Error removing client:", err);
      toast({
        title: t('common.errorLabel'),
        description: err?.message || t('clients.delete.error'),
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
          <AlertDialogTitle>{t('clients.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('clients.delete.description')}
            {client && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="font-medium">{client.name}</p>
                <p className="text-sm text-muted-foreground">{client.email}</p>
                <p className="text-sm text-muted-foreground">{client.phone}</p>
                <p className="text-sm mt-1">
                  <span className="text-destructive font-medium">{client.appointmentsCount}</span> {t('clients.delete.appointmentsWillBeDeleted')}
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
                {t('clients.delete.removing')}
              </>
            ) : (
              t('clients.delete.confirm')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
