import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DynamicAppointmentForm } from "@/components/appointments/dynamic-appointment-form";

export default async function NewAppointmentPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch global form settings
  const { data: formSettings, error: settingsError } = await supabase
    .from("form_settings")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  if (settingsError && settingsError.code !== 'PGRST116') {
    console.error("Error fetching form settings:", settingsError);
  }

  // Default settings if none found
  const settings = formSettings || {
    form_title: "Book an Appointment",
    form_description: "Fill out the form below to schedule your appointment.",
    logo_url: null,
    accent_color: "#6366f1",
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="New Appointment"
        text="Create a new appointment in your schedule."
      />
      <div className="mt-6">
        <DynamicAppointmentForm
          userId={session.user.id}
          defaultTypeId={null}
          initialSettings={settings}
          isDashboard={true}
        />
      </div>
    </DashboardShell>
  );
}
