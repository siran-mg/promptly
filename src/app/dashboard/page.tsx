import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, Plus, Share } from "lucide-react";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch appointments for the current user
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", session.user.id)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching appointments:", error);
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Welcome to your Promptly dashboard."
      />

      {/* Dashboard Overview with Charts */}
      <DashboardOverview appointments={appointments || []} />

      {/* Quick Actions Card */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" asChild>
                <Link href="/dashboard/appointments">
                  <CalendarClock className="h-6 w-6" />
                  <span>View Appointments</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" asChild>
                <Link href="/booking">
                  <Plus className="h-6 w-6" />
                  <span>New Appointment</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" asChild>
                <Link href="/dashboard/settings?tab=form">
                  <Share className="h-6 w-6" />
                  <span>Share Booking Form</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
