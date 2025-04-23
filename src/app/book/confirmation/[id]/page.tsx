import { notFound } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { format } from "date-fns";
import { CalendarClock, Mail, Phone, FileText, CheckCircle } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AppointmentConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("*, profiles:user_id(full_name)")
      .eq("id", id)
      .single();

    if (error || !appointment) {
      console.error("Error fetching appointment:", error);
      return notFound();
    }

    return (
      <>
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-3xl px-4 md:px-6">
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Appointment Confirmed!
                </h1>
                <p className="text-gray-500 md:text-xl dark:text-gray-400">
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

              <div className="flex justify-center">
                <Link href="/">
                  <Button>Return to Home</Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  } catch (error) {
    console.error("Error in confirmation page:", error);
    return notFound();
  }
}
