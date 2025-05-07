import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { NotificationsProviderWrapper } from "@/components/providers/notifications-provider-wrapper";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Redirect to the default locale login page
    redirect("/en/login");
  }

  return (
    <NotificationsProviderWrapper>
      <DashboardWrapper>
        {children}
      </DashboardWrapper>
    </NotificationsProviderWrapper>
  );
}
