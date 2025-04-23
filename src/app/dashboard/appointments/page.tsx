import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { AppointmentsCalendarClient } from "@/components/appointments/appointments-calendar-client";
import { Button } from "@/components/ui/button";
import { Plus, List, Calendar } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AppointmentsPage() {
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
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching appointments:", error);
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Appointments"
        text="Manage your upcoming and past appointments."
      >
        <Link href="/booking">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </Link>
      </DashboardHeader>
      <div className="mt-6">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="space-y-4">
            <AppointmentsCalendarClient appointments={appointments || []} />
          </TabsContent>
          <TabsContent value="list" className="space-y-4">
            <AppointmentsTable appointments={appointments || []} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
