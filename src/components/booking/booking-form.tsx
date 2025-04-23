"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarClock, Loader2 } from "lucide-react";

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
      // In a real app, you would submit this data to your API
      console.log({
        ...data,
        date,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsSuccess(true);
      reset();
      setDate(null);
    } catch (error) {
      console.error("Error submitting form:", error);
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
