import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AppointmentTypesClient } from "@/components/settings/appointment-types-client";
import { Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Appointment Types | Coachly",
  description: "Manage your appointment types",
};

export default async function AppointmentTypesPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const t = await getTranslations({ locale, namespace: "settings" });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={
          <span className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            {t("appointmentTypes.title")}
          </span>
        }
        text={t("appointmentTypes.subtitle")}
      />
      <div className="mt-6 space-y-6">
        <AppointmentTypesClient />
      </div>
    </DashboardShell>
  );
}
