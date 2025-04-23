import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CalendarClock, Mail, Phone, FileText } from "lucide-react";

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
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Fetch appointment by share_token
  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("share_token", token)
    .single();

  if (error || !appointment) {
    console.error("Error fetching appointment:", error);
    return notFound();
  }

  // Validate that the token is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    console.error("Invalid token format:", token);
    return notFound();
  }

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
                  <AppointmentStatusBadge status={appointment.status} />
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
