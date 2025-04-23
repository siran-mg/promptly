import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

import { UserProfile } from "@/components/auth/user-profile";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/login");
  }
  
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Welcome to your Promptly dashboard."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <UserProfile />
      </div>
    </DashboardShell>
  );
}
