import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CalendarClock, Mail, Phone, FileText } from "lucide-react";
import { headers } from "next/headers";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";

export default async function AppointmentPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;

  // Validate that the token is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    console.error("Invalid token format:", token);
    return notFound();
  }

  try {
    // Get the host from headers
    const headersList = headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';

    // Use our API endpoint to fetch the appointment
    const response = await fetch(`${protocol}://${host}/api/appointments/view/${token}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('API response error:', response.status, response.statusText);
      return notFound();
    }

    const data = await response.json();

    if (!data.appointment) {
      console.error('No appointment data returned from API');
      return notFound();
    }

    return renderAppointment(data.appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return notFound();
  }
}

// Helper function to render the appointment details
function renderAppointment(appointment: any) {
  return (
    <>
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl px-4 md:px-6">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Appointment Details
              </h1>
              <p className="text-gray-500 md:text-xl dark:text-gray-400">
                Your appointment information is below.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Appointment Information</CardTitle>
                  <AppointmentStatusBadge status={appointment.status || 'scheduled'} />
                </div>
                <CardDescription>
                  Please review your appointment details below.
                </CardDescription>
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
      </main>
      <Footer />
    </>
  );
}
