import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AppointmentTypeFormClient } from "@/components/settings/appointment-type-form-client";

export default async function AppointmentTypeFormPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch appointment type
  const { data: appointmentType, error } = await supabase
    .from("appointment_types")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single();

  if (error) {
    console.error("Error fetching appointment type:", error);
    redirect("/dashboard/settings/appointment-types");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Form Settings"
        text={`Customize the booking form for ${appointmentType.name}`}
      />
      <div className="mt-6">
        <AppointmentTypeFormClient
          appointmentTypeId={params.id}
          appointmentType={appointmentType}
        />
      </div>
    </DashboardShell>
  );
}
