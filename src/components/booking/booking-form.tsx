"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarClock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const bookingSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookingForm() {
  const [date, setDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Check for date parameter in URL
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      try {
        const parsedDate = new Date(dateParam);
        // Check if the date is valid
        if (!isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
        }
      } catch (error) {
        console.error('Error parsing date from URL:', error);
      }
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
  });

  const onSubmit = async (data: BookingFormValues) => {
    if (!date) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();

      // Prepare appointment data
      const appointmentData = {
        user_id: session?.user?.id || '95b66ca9-217e-464c-884d-d92debbf886a', // Fallback to a default user ID if not logged in
        client_name: data.name,
        client_email: data.email,
        client_phone: data.phone,
        date: date.toISOString(),
        notes: data.notes || null,
        status: 'scheduled'
      };

      // Insert the appointment into the database
      const { data: appointmentResult, error: insertError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting appointment:', insertError);
        toast({
          title: 'Error',
          description: 'There was a problem saving your appointment. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Send admin email notification
      try {
        console.log("Sending admin email notification for appointment:", appointmentResult.id);

        const emailResponse = await fetch('/api/appointments/send-admin-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointmentId: appointmentResult.id,
          }),
        });

        const emailResult = await emailResponse.json();
        console.log("Admin email notification result:", emailResult);

        if (emailResult.previewUrl) {
          // For development, show a toast with the preview URL
          toast({
            title: 'Admin Email Sent',
            description: (
              <div>
                Email preview available at{' '}
                <a
                  href={emailResult.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-500"
                >
                  View Email
                </a>
              </div>
            ),
            duration: 10000, // Show for 10 seconds
          });
        }
      } catch (emailError) {
        console.error("Error sending admin email notification:", emailError);
        // Continue anyway as the main appointment was created
      }

      toast({
        title: 'Appointment Booked',
        description: 'Your appointment has been successfully scheduled.',
      });

      setIsSuccess(true);
      reset();
      setDate(null);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Booking Confirmed!</CardTitle>
          <CardDescription className="text-center">
            Thank you for booking an appointment with us.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CalendarClock className="h-10 w-10 text-green-600" />
          </div>
          <p>
            We have sent a confirmation email with all the details. You will also receive a reminder before your appointment.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => setIsSuccess(false)}>Book Another Appointment</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Appointment Details</CardTitle>
        <CardDescription>
          Please fill out the form below to schedule your appointment.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date and Time</Label>
            <DatePicker
              date={date}
              setDate={setDate}
              showTimeSelect={true}
              dateFormat="MMMM d, yyyy h:mm aa"
            />
            {!date && <p className="text-sm text-red-500">Please select a date and time</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" {...register("phone")} />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !date}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Book Appointment"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
