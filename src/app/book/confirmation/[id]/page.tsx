import { notFound } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { format } from "date-fns";
import { CalendarClock, Mail, Phone, FileText, CheckCircle } from "lucide-react";

// Removed header and footer imports for public form
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Removed Button and Link imports

export default async function AppointmentConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // Fetch the appointment without trying to join with profiles
    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();

    console.log('Fetched appointment:', appointment);

    if (error || !appointment) {
      console.error("Error fetching appointment:", error);
      return notFound();
    }

    // Get the form settings for the user who owns this appointment
    const { data: formSettings } = await supabase
      .from("form_settings")
      .select("*")
      .eq("user_id", appointment.user_id)
      .single();

    // Use default settings if none found
    const settings = formSettings || {
      logo_url: null,
      accent_color: "#6366f1"
    };

    console.log('Form settings:', settings);

    // Create a style object for the accent color
    const accentColorStyle = {
      "--accent-color": settings.accent_color,
      "--accent-color-foreground": "white",
    } as React.CSSProperties;

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" style={accentColorStyle}>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {settings.logo_url && (
              <div className="flex justify-center pt-8">
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}
            <div className="px-6 py-8 sm:p-10">
              <div className="space-y-6">
                <div className="flex flex-col items-center space-y-4 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Appointment Confirmed!
                  </h1>
                  <p className="text-gray-500 md:text-lg">
                    Your appointment has been successfully scheduled.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Appointment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-start gap-4">
                      <CalendarClock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">Date and Time</h3>
                        <p>{format(new Date(appointment.date), "PPPP 'at' p")}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Mail className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">Email</h3>
                        <p>{appointment.client_email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Phone className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">Phone</h3>
                        <p>{appointment.client_phone}</p>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="flex items-start gap-4">
                        <FileText className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h3 className="font-medium">Notes</h3>
                          <p>{appointment.notes}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in confirmation page:", error);
    return notFound();
  }
}
