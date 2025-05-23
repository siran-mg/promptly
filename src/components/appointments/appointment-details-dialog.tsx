"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useDateFormatter } from "@/hooks/use-date-formatter";
import { useStatusFormatter } from "@/hooks/use-status-formatter";
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
  const t = useTranslations();
  const { formatDate, formatTime, formatDuration } = useDateFormatter();
  const { translateStatus, getStatusVariant } = useStatusFormatter();
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

      const translatedStatus = translateStatus(newStatus);

      toast({
        title: t('appointments.statusUpdated'),
        description: t('appointments.statusUpdatedDescription', { status: translatedStatus }),
      });

      // Call the callback to update parent component state
      if (onStatusChange) {
        onStatusChange(appointment.id, newStatus);
      }
    } catch (err: any) {
      console.error("Error updating appointment status:", err);
      toast({
        title: t('common.errorLabel'),
        description: err?.message || t('appointments.errors.statusUpdateFailed'),
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
        title: t('appointments.updated'),
        description: t('appointments.updatedDescription'),
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
        title: t('common.errorLabel'),
        description: err?.message || t('appointments.errors.updateFailed'),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date for display
  const appointmentDate = new Date(appointment.date);
  const formattedDate = formatDate(appointmentDate);
  const formattedTime = formatTime(appointmentDate);

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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center">
              <User className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-primary" />
              <DialogTitle className="text-lg sm:text-xl font-bold truncate">
                {appointment.client_name}
              </DialogTitle>
            </div>

            {isEditMode && (
              <div className="flex gap-2 self-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                  onClick={() => setIsEditMode(false)}
                  disabled={isUpdating}
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  {t('common.cancelButton')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm text-primary"
                  onClick={handleSaveChanges}
                  disabled={isUpdating}
                >
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  {t('common.save')}
                </Button>
              </div>
            )}

            {!isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm text-primary self-end"
                onClick={() => setIsEditMode(true)}
              >
                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                {t('common.editButton')}
              </Button>
            )}
          </div>
          <DialogDescription className="text-center text-xs sm:text-sm pt-2 pb-3 sm:pb-4">
            {t('appointments.details')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-1 sm:py-2">
          {/* Appointment details card */}
          <div className="bg-primary/5 p-3 sm:p-4 rounded-lg border border-primary/20">
            <h3 className="text-xs sm:text-sm font-medium flex items-center mb-2 sm:mb-3">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary" />
              {t('appointments.details')}
            </h3>

            <div className="space-y-2 sm:space-y-3">
              {/* Type */}
              <div className="flex items-center">
                <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm font-medium w-16 sm:w-20">{t('appointments.type')}:</span>

                {!isEditMode ? (
                  <div className="flex items-center">
                    {appointment.appointment_type?.color && (
                      <div
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mr-1.5 sm:mr-2"
                        style={{ backgroundColor: appointment.appointment_type.color }}
                      />
                    )}
                    <span className="text-xs sm:text-sm">
                      {appointment.appointment_type?.name ||
                       (appointment.appointment_type_id ? t('common.loading') : t('appointments.notSpecified'))}
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
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm font-medium w-16 sm:w-20">{t('appointments.date')}:</span>
                <span className="text-xs sm:text-sm">{formattedDate}</span>
              </div>

              {/* Time */}
              <div className="flex items-center">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm font-medium w-16 sm:w-20">{t('appointments.time')}:</span>
                <span className="text-xs sm:text-sm">{formattedTime}</span>
                {appointment.appointment_type?.duration && (
                  <span className="text-muted-foreground text-xs sm:text-sm ml-1">
                    ({formatDuration(appointment.appointment_type.duration)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact information card */}
          <div className="bg-primary/5 p-3 sm:p-4 rounded-lg border border-primary/20">
            <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary" />
              {t('appointments.contactInformation')}
            </h3>

            <div className="space-y-2 sm:space-y-3">
              {/* Email */}
              <div className="flex items-center">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm font-medium w-16 sm:w-20">{t('common.email')}:</span>

                {!isEditMode ? (
                  appointment.client_email ? (
                    <a
                      href={`mailto:${appointment.client_email}`}
                      className="text-xs sm:text-sm text-primary hover:underline truncate"
                    >
                      {appointment.client_email}
                    </a>
                  ) : (
                    <span className="text-xs sm:text-sm text-muted-foreground">{t('common.notProvided')}</span>
                  )
                ) : (
                  <div className="flex-1">
                    <Input
                      name="client_email"
                      value={appointmentData.client_email}
                      onChange={handleInputChange}
                      placeholder={t('appointments.emailPlaceholder')}
                      className="h-7 sm:h-8 text-xs sm:text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm font-medium w-16 sm:w-20">{t('common.phone')}:</span>

                {!isEditMode ? (
                  appointment.client_phone ? (
                    <a
                      href={`tel:${appointment.client_phone}`}
                      className="text-xs sm:text-sm text-primary hover:underline"
                    >
                      {appointment.client_phone}
                    </a>
                  ) : (
                    <span className="text-xs sm:text-sm text-muted-foreground">{t('common.notProvided')}</span>
                  )
                ) : (
                  <div className="flex-1">
                    <Input
                      name="client_phone"
                      value={appointmentData.client_phone}
                      onChange={handleInputChange}
                      placeholder={t('appointments.phonePlaceholder')}
                      className="h-7 sm:h-8 text-xs sm:text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Name - only in edit mode */}
              {isEditMode && (
                <div className="flex items-center">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mr-1.5 sm:mr-2" />
                  <span className="text-xs sm:text-sm font-medium w-16 sm:w-20">{t('common.name')}:</span>
                  <div className="flex-1">
                    <Input
                      name="client_name"
                      value={appointmentData.client_name}
                      onChange={handleInputChange}
                      placeholder={t('appointments.clientNamePlaceholder')}
                      className="h-7 sm:h-8 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status card */}
          <div className="bg-primary/5 p-3 sm:p-4 rounded-lg border border-primary/20">
            <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary" />
              {t('appointments.statusHeading')}
            </h3>

            <div className="flex items-center">
              <span className="text-xs sm:text-sm font-medium w-16 sm:w-20">{t('appointments.status')}:</span>
              <div className="flex-1">
                <Select
                  value={status}
                  onValueChange={handleStatusChange}
                  disabled={isUpdating || isEditMode}
                >
                  <SelectTrigger className="w-[120px] sm:w-[140px] h-7 sm:h-8 text-xs sm:text-sm">
                    <SelectValue>
                      <Badge
                        variant={getStatusVariant(status)}
                        className="font-normal text-xs"
                      >
                        {translateStatus(status)}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">
                      <Badge variant={getStatusVariant("scheduled")} className="font-normal text-xs">{translateStatus("scheduled")}</Badge>
                    </SelectItem>
                    <SelectItem value="completed">
                      <Badge variant={getStatusVariant("completed")} className="font-normal text-xs">{translateStatus("completed")}</Badge>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <Badge variant={getStatusVariant("cancelled")} className="font-normal text-xs">{translateStatus("cancelled")}</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes section - always show in edit mode */}
          {(appointment.notes || isEditMode) && (
            <div className="bg-primary/5 p-3 sm:p-4 rounded-lg border border-primary/20">
              <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary" />
                {t('appointments.notes')}
              </h3>

              {!isEditMode ? (
                <p className="text-xs sm:text-sm whitespace-pre-wrap pl-4 sm:pl-6">{appointment.notes}</p>
              ) : (
                <div className="pl-4 sm:pl-6">
                  <textarea
                    name="notes"
                    value={appointmentData.notes || ''}
                    onChange={handleInputChange}
                    placeholder={t('appointments.notesPlaceholder')}
                    className="w-full min-h-[80px] sm:min-h-[100px] text-xs sm:text-sm p-2 rounded-md border border-input bg-background"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 mt-3 sm:mt-4">
          <Button
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            {t('appointments.delete')}
          </Button>

          <div className="flex gap-2 w-full sm:w-auto">
            {onShare && (
              <Button
                variant="outline"
                className="text-xs sm:text-sm h-8 sm:h-9 flex-1 sm:flex-none"
                onClick={onShare}
              >
                <Share className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {t('common.share')}
              </Button>
            )}
            <Button
              variant="default"
              className="text-xs sm:text-sm h-8 sm:h-9 flex-1 sm:flex-none"
              onClick={() => onOpenChange(false)}
            >
              {t('common.close')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
