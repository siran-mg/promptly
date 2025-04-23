"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { AppointmentTypeSelector } from "./appointment-type-selector";
import { CustomFields } from "./custom-fields";

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
}

export function AppointmentForm({ userId, accentColor = "#6366f1" }: AppointmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    date: new Date(),
    time: "09:00",
    notes: "",
    appointmentTypeId: "",
  });

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
    }
  };

  const handleTimeChange = (time: string) => {
    setFormData((prev) => ({ ...prev, time }));
  };

  // Fetch appointment type details when the type changes
  useEffect(() => {
    if (!formData.appointmentTypeId) return;

    // You could fetch additional details about the appointment type here if needed
  }, [formData.appointmentTypeId]);

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
          title: "Error",
          description: "Could not create appointment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Your appointment has been scheduled.",
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

      // Redirect to confirmation page
      router.push(`/book/confirmation/${data.id}`);
    } catch (err) {
      console.error("Error submitting form:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
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
            <Label htmlFor="clientName">Your Name</Label>
            <Input
              id="clientName"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email</Label>
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
            <Label htmlFor="clientPhone">Phone Number</Label>
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
              <Label>Date</Label>
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
                      <span>Pick a date</span>
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
              <Label>Time</Label>
              <TimePicker
                value={formData.time}
                onChange={handleTimeChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Appointment Type</Label>
            <AppointmentTypeSelector
              value={formData.appointmentTypeId}
              onChange={(value) => setFormData(prev => ({ ...prev, appointmentTypeId: value }))}
              userId={userId}
            />
          </div>

          {/* Custom fields based on appointment type */}
          {formData.appointmentTypeId && (
            <CustomFields
              appointmentTypeId={formData.appointmentTypeId}
              values={customFieldValues}
              onChange={handleCustomFieldChange}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
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
            {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
