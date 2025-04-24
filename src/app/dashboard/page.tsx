import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { SmartShareButton } from "@/components/dashboard/smart-share-button";
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
      {/* Hero Section with Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 -mx-6 px-6 py-8 mb-8 border-b">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Welcome to your Dashboard</h1>
        <p className="text-muted-foreground mb-6">Manage your appointments and booking settings</p>

        <div className="grid gap-4 md:grid-cols-3">
          <Button variant="default" size="lg" className="h-24 flex flex-col items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md" asChild>
            <Link href="/dashboard/appointments/new">
              <Plus className="h-6 w-6 mb-1" />
              <div className="text-center">
                <div className="font-medium text-base">New Appointment</div>
                <div className="text-xs opacity-90">Schedule a new appointment</div>
              </div>
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-24 flex flex-col items-center justify-center gap-2 bg-white shadow-sm" asChild>
            <Link href="/dashboard/appointments">
              <CalendarClock className="h-6 w-6 mb-1 text-indigo-600" />
              <div className="text-center">
                <div className="font-medium text-base">View Appointments</div>
                <div className="text-xs text-muted-foreground">Manage your schedule</div>
              </div>
            </Link>
          </Button>
          <div className="relative h-24 flex flex-col items-center justify-center gap-2 bg-white shadow-sm rounded-md border hover:bg-gray-50 transition-colors cursor-pointer group">
            {/* Invisible button that covers the entire card for accessibility */}
            <div className="absolute inset-0 w-full h-full">
              <SmartShareButton variant="ghost" className="w-full h-full opacity-0" />
            </div>

            {/* Visual content */}
            <Share className="h-6 w-6 mb-1 text-indigo-600 group-hover:text-indigo-700" />
            <div className="text-center mt-1">
              <div className="font-medium text-base">Share Booking Form</div>
              <div className="text-xs text-muted-foreground">Let clients book with you</div>
            </div>
          </div>
        </div>
      </div>

      <DashboardHeader
        heading="Dashboard Overview"
        text="Track your appointments and performance."
      />

      {/* Main Content */}
      <div className="space-y-6">

        {/* Dashboard Overview with Charts */}
        <DashboardOverview appointments={appointments || []} />

        {/* Additional Resources */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Help & Resources</CardTitle>
              <CardDescription>
                Learn more about using Promptly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CalendarClock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Managing Your Schedule</h3>
                    <p className="text-sm text-muted-foreground">Learn how to effectively manage your appointments and client bookings.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Share className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Customizing Your Booking Form</h3>
                    <p className="text-sm text-muted-foreground">Personalize your booking form to match your brand and collect the information you need.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
