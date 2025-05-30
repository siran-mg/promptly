import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AppointmentTypeFieldsClient } from "@/components/settings/appointment-type-fields-client";
import { FormInput } from "lucide-react";

export default async function AppointmentTypeFieldsPage({
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
            <FormInput className="h-6 w-6 text-indigo-600" />
            {t("appointmentTypes.customFieldsFor", { name: appointmentType.name })}
          </span>
        }
        text={t("appointmentTypes.customFieldsDescription")}
      />
      <div className="mt-6">
        <AppointmentTypeFieldsClient
          appointmentTypeId={id}
          appointmentTypeName={appointmentType.name}
        />
      </div>
    </DashboardShell>
  );
}
