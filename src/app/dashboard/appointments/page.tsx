import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

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
        <AppointmentsTable appointments={appointments || []} />
      </div>
    </DashboardShell>
  );
}
