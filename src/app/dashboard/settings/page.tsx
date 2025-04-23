import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FormSettings } from "@/components/settings/form-settings";

export const metadata: Metadata = {
  title: "Settings | Promptly",
  description: "Manage your account settings and preferences",
};

export default async function SettingsPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Settings"
        text="Manage your account settings and preferences."
      />
      <div className="mt-6 space-y-6">
        <div>
          <h3 className="text-lg font-medium">Form Customization</h3>
          <p className="text-sm text-muted-foreground">
            Customize how your appointment booking form appears to clients.
          </p>
        </div>
        <FormSettings />
      </div>
    </DashboardShell>
  );
}
