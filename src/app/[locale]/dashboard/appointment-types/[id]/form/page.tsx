import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AppointmentTypeFormClient } from "@/components/settings/appointment-type-form-client";
import { Palette } from "lucide-react";

export default async function AppointmentTypeFormPage({
  params: { id, locale }
}: {
  params: { id: string, locale: string }
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const t = await getTranslations({ locale, namespace: "settings" });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch appointment type
  const { data: appointmentType, error } = await supabase
    .from("appointment_types")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (error) {
    console.error("Error fetching appointment type:", error);
    redirect("/dashboard/appointment-types");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={
          <span className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-indigo-600" />
            {t("appointmentTypes.formSettingsFor", { name: appointmentType.name })}
          </span>
        }
        text={t("appointmentTypes.formSettingsDescription")}
      />
      <div className="mt-6">
        <AppointmentTypeFormClient
          appointmentTypeId={id}
          appointmentType={appointmentType}
        />
      </div>
    </DashboardShell>
  );
}
