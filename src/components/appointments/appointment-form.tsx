"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { AppointmentTypeSelector } from "./appointment-type-selector";
import { CustomFields } from "./custom-fields";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
// Using a simple date picker component for better display
import { SimpleDatePicker } from "./simple-date-picker";
import { TimePicker } from "./time-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// Select components removed as we're now using TimePicker
import { cn } from "@/lib/utils";

interface AppointmentFormProps {
  userId: string;
  accentColor?: string;
  defaultTypeId?: string | null;
  onAppointmentTypeChange?: (typeId: string) => void;
  initialDate?: Date | null;
  selectedTypes?: string[];
  hideAppointmentTypes?: boolean;
  isDashboard?: boolean;
}

export function AppointmentForm({
  userId,
  accentColor = "#6366f1",
  defaultTypeId = null,
  onAppointmentTypeChange,
  initialDate = null,
  selectedTypes = [],
  hideAppointmentTypes = false,
  isDashboard = false
}: AppointmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const t = useTranslations();

  console.log('AppointmentForm initialized with:', { userId, accentColor, defaultTypeId });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAppointmentTypes, setHasAppointmentTypes] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    date: initialDate || new Date(),
    time: initialDate ? format(initialDate, "HH:mm") : "09:00",
    notes: "",
    appointmentTypeId: "",
  });

  const [disabledTimeSlots, setDisabledTimeSlots] = useState<string[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);

  // Check if user has any appointment types
  useEffect(() => {
    const checkAppointmentTypes = async () => {
      try {
        const { data, error } = await supabase
          .from("appointment_types")
          .select("id")
          .eq("user_id", userId)
          .limit(1);

        if (error) {
          console.error('Error checking appointment types:', error);
          return;
        }

        setHasAppointmentTypes(data && data.length > 0);
      } catch (err) {
        console.error('Error checking appointment types:', err);
      }
    };

    checkAppointmentTypes();
  }, [userId, supabase]);

  // Set appointment type from defaultTypeId or URL parameter
  useEffect(() => {
    const setAppointmentType = async (typeId: string) => {
      console.log('Setting appointment type to:', typeId);

      // Verify that the appointment type exists
      try {
        const { data, error } = await supabase
          .from("appointment_types")
          .select("id, name")
          .eq("id", typeId)
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error('Error verifying appointment type:', error);
          return;
        }

        if (data) {
          console.log('Verified appointment type exists:', data);
          setFormData(prev => ({ ...prev, appointmentTypeId: typeId }));
        } else {
          console.warn('Appointment type not found:', typeId);
        }
      } catch (err) {
        console.error('Error in setAppointmentType:', err);
      }
    };

    // First check if we have a defaultTypeId prop
    if (defaultTypeId) {
      console.log('Setting appointment type from defaultTypeId:', defaultTypeId);
      setAppointmentType(defaultTypeId);
    }
    // Otherwise check URL parameters
    else if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const typeId = url.searchParams.get('type');
      if (typeId) {
        console.log('Setting appointment type from URL parameter:', typeId);
        setAppointmentType(typeId);
      }
    }
  }, [defaultTypeId, userId, supabase]);

  // Fetch available time slots when the date changes
  useEffect(() => {
    if (formData.date) {
      fetchAvailableTimeSlots(formData.date);
    }
  }, [formData.date]);

  // Check for client information in URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const clientName = url.searchParams.get('clientName');
      const clientEmail = url.searchParams.get('clientEmail');
      const clientPhone = url.searchParams.get('clientPhone');

      // Update form data with client information if available
      if (clientName || clientEmail || clientPhone) {
        console.log('Pre-filling client information from URL parameters');
        setFormData(prev => ({
          ...prev,
          clientName: clientName || prev.clientName,
          clientEmail: clientEmail || prev.clientEmail,
          clientPhone: clientPhone || prev.clientPhone
        }));
      }
    }
  }, []);

  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Time slots are now handled by the TimePicker component

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    console.log('Date selected:', date);
    if (date) {
      setFormData((prev) => {
        console.log('Updating form data with date:', date);
        return { ...prev, date };
      });

      // Fetch available time slots for the selected date
      fetchAvailableTimeSlots(date);
    }
  };

  const handleTimeChange = (time: string) => {
    setFormData((prev) => ({ ...prev, time }));
  };

  // Fetch available time slots for the selected date
  const fetchAvailableTimeSlots = async (date: Date) => {
    setIsLoadingTimeSlots(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await fetch(`/api/appointments/available-slots?date=${dateStr}&userId=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch available time slots');
      }

      const data = await response.json();

      // Create a list of disabled slots (all slots that are not available)
      const allSlots = generateTimeSlots();
      const disabled = allSlots.filter(slot => !data.availableSlots.includes(slot));
      setDisabledTimeSlots(disabled);
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      toast({
        title: t('appointments.form.error'),
        description: t('appointments.form.errorFetchingTimeSlots'),
        variant: "destructive",
      });
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  // Generate time slots from 00:00 to 23:30 in 30-minute increments
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return slots;
  };

  // Fetch appointment type details when the type changes
  const [appointmentTypeDuration, setAppointmentTypeDuration] = useState<number>(60);

  useEffect(() => {
    if (!formData.appointmentTypeId) {
      setAppointmentTypeDuration(60); // Reset to default duration
      return;
    }

    // Fetch appointment type details to get the duration
    const fetchAppointmentTypeDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("appointment_types")
          .select("duration")
          .eq("id", formData.appointmentTypeId)
          .single();

        if (error) {
          console.error('Error fetching appointment type details:', error);
          return;
        }

        if (data) {
          console.log('Fetched appointment type duration:', data.duration);
          setAppointmentTypeDuration(data.duration);
        }
      } catch (err) {
        console.error('Error in fetchAppointmentTypeDetails:', err);
      }
    };

    fetchAppointmentTypeDetails();
  }, [formData.appointmentTypeId, supabase]);

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time
      const [hours, minutes] = formData.time.split(":").map(Number);
      const appointmentDate = new Date(formData.date);
      appointmentDate.setHours(hours, minutes, 0, 0);

      // Create the appointment
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          user_id: userId,
          client_name: formData.clientName,
          client_email: formData.clientEmail,
          client_phone: formData.clientPhone,
          date: appointmentDate.toISOString(),
          notes: formData.notes,
          status: "scheduled",
          appointment_type_id: formData.appointmentTypeId || null,
          metadata: Object.keys(customFieldValues).length > 0 ? customFieldValues : null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating appointment:", error);
        toast({
          title: t('appointments.form.error'),
          description: t('appointments.form.createError'),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t('appointments.form.success'),
        description: t('appointments.form.successMessage'),
      });

      // If we have custom fields, save them
      if (Object.keys(customFieldValues).length > 0 && data) {
        const fieldValues = Object.entries(customFieldValues).map(([fieldId, value]) => ({
          appointment_id: data.id,
          field_id: fieldId,
          value: value
        }));

        const { error: fieldError } = await supabase
          .from("appointment_field_values")
          .insert(fieldValues);

        if (fieldError) {
          console.error("Error saving custom field values:", fieldError);
          // Continue anyway as the main appointment was created
        }
      }

      // Create a notification if this is a booking from a shared link (not from dashboard)
      if (!isDashboard && data) {
        try {
          // Get appointment type name if available
          let appointmentTypeName = "Appointment";
          if (formData.appointmentTypeId) {
            const { data: typeData } = await supabase
              .from("appointment_types")
              .select("name")
              .eq("id", formData.appointmentTypeId)
              .single();

            if (typeData) {
              appointmentTypeName = typeData.name;
            }
          }

          // Create notification
          const { data: notificationData, error: notificationError } = await supabase
            .from("notifications")
            .insert({
              user_id: userId,
              type: "new_appointment",
              content: {
                clientName: formData.clientName,
                date: appointmentDate.toISOString(),
                appointmentTypeName,
              },
              related_id: data.id,
              is_read: false,
            })
            .select()
            .single();

          if (notificationError) {
            console.error("Error creating notification:", notificationError);
          } else {
            // Send push notification if the in-app notification was created successfully
            const notificationId = notificationData?.id;
            try {
              console.log("Sending push notification for new appointment");

              const pushResponse = await fetch('/api/push/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId,
                  title: 'New Appointment Booked',
                  body: `${formData.clientName} booked a ${appointmentTypeName} for ${format(appointmentDate, "MMM d, yyyy 'at' h:mm a")}`,
                  url: `/dashboard/appointments?appointmentId=${data.id}`,
                  tag: 'new-appointment',
                  // Ensure actions are properly formatted for notification API
                  actions: [
                    {
                      action: 'view',
                      title: 'View Appointment',
                      icon: '/view-icon.svg'  // Optional icon for platforms that support it
                    },
                    {
                      action: 'markAsRead',
                      title: 'Mark as Read',
                      icon: '/check-icon.svg'  // Optional icon for platforms that support it
                    }
                  ],
                  // Force these settings to ensure actions are visible
                  requireInteraction: true,
                  renotify: true,
                  data: {
                    appointmentId: data.id,
                    notificationId: notificationId,
                    clientName: formData.clientName,
                    appointmentType: appointmentTypeName,
                    date: appointmentDate.toISOString(),
                    time: formData.time
                  }
                }),
              });

              const pushResult = await pushResponse.json();
              console.log("Push notification result:", pushResult);
            } catch (pushError) {
              console.error("Error sending push notification:", pushError);
              // Continue anyway as the main appointment and notification were created
            }
          }
        } catch (notifError) {
          console.error("Error creating notification:", notifError);
          // Continue anyway as the main appointment was created
        }
      }

      // Reset form
      setFormData({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        date: new Date(),
        time: "09:00",
        notes: "",
        appointmentTypeId: "",
      });
      setCustomFieldValues({});

      // Redirect based on context
      if (isDashboard) {
        // If created from dashboard, redirect to appointments calendar view
        router.push('/dashboard/appointments?view=calendar');
      } else {
        // If created from public form, redirect to confirmation page
        router.push(`/book/confirmation/${data.id}`);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      toast({
        title: t('appointments.form.error'),
        description: t('appointments.form.unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="clientName">{t('appointments.form.yourName')}</Label>
            <Input
              id="clientName"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientEmail">{t('appointments.form.email')}</Label>
            <Input
              id="clientEmail"
              name="clientEmail"
              type="email"
              value={formData.clientEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientPhone">{t('appointments.form.phoneNumber')}</Label>
            <Input
              id="clientPhone"
              name="clientPhone"
              type="tel"
              value={formData.clientPhone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('appointments.form.date')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, "PPP")
                    ) : (
                      <span>{t('appointments.form.pickDate')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center" sideOffset={4}>
                  <SimpleDatePicker
                    selected={formData.date}
                    onSelect={handleDateChange}
                    disabled={(date: Date) => date < new Date()}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t('appointments.form.time')}</Label>
              <TimePicker
                value={formData.time}
                onChange={handleTimeChange}
                disabledSlots={disabledTimeSlots}
                duration={appointmentTypeDuration}
              />
            </div>
          </div>

          {/* Only show appointment type selector if there are appointment types and it's not hidden */}
          {hasAppointmentTypes && !hideAppointmentTypes && (
            <div className="space-y-2">
              <Label>{t('appointments.form.appointmentType')}</Label>
              <AppointmentTypeSelector
                value={formData.appointmentTypeId}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, appointmentTypeId: value }));

                  // Call the callback if provided
                  if (onAppointmentTypeChange) {
                    onAppointmentTypeChange(value);
                  }

                  // Also dispatch a custom event for other components to listen to
                  if (typeof window !== 'undefined') {
                    const event = new CustomEvent('appointmentTypeChanged', {
                      detail: { typeId: value }
                    });
                    window.dispatchEvent(event);
                  }
                }}
                userId={userId}
                allowedTypes={selectedTypes}
              />
            </div>
          )}

          {/* Custom fields based on appointment type */}
          {hasAppointmentTypes && formData.appointmentTypeId && (
            <CustomFields
              appointmentTypeId={formData.appointmentTypeId}
              values={customFieldValues}
              onChange={handleCustomFieldChange}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">{t('appointments.form.notes')}</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            style={{ backgroundColor: accentColor }}
          >
            {isSubmitting ? t('appointments.form.scheduling') : t('appointments.form.scheduleAppointment')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
