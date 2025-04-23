import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

import { UserProfile } from "@/components/auth/user-profile";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ShareFormButton } from "@/components/dashboard/share-form-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
              Manage your profile information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserProfile />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Booking</CardTitle>
            <CardDescription>
              Share your booking form with clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a unique link that clients can use to book appointments with you.
              Share this link on your website, social media, or via email.
            </p>
            <ShareFormButton userId={session.user.id} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
