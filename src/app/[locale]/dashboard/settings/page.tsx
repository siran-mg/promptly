import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FormSettings } from "@/components/settings/form-settings";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Sliders } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings | Coachly",
  description: "Manage your account settings and preferences",
};

export default async function SettingsPage({
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
            <Sliders className="h-6 w-6 text-indigo-600" />
            {t("title")}
          </span>
        }
        text={t("description")}
      />
      <div className="mt-6 space-y-6">
        <SettingsTabs
          profileSettings={<ProfileSettings />}
          formSettings={<FormSettings />}
          notificationSettings={<NotificationSettings />}
        />
      </div>
    </DashboardShell>
  );
}
