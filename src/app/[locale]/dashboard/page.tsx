import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { ActionCard } from "@/components/dashboard/action-card";
import { ShareActionCard } from "@/components/dashboard/share-action-card";
import { Sparkles, BarChart3 } from "lucide-react";

export default async function DashboardPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  console.log('Dashboard page locale:', locale);
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const t = await getTranslations({ locale, namespace: "dashboard" });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch appointments for the current user
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", session.user.id)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching appointments:", error);
  }

  return (
    <DashboardShell>
      {/* Hero Section with Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 -mx-3 md:-mx-6 px-4 md:px-6 py-6 md:py-8 mb-6 md:mb-8 border-b">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-1">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
            {t('welcomeBack')}
          </span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base mb-5 md:mb-6">
          {t('manageAppointments')}
        </p>

        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
          {/* Create Appointment Card */}
          <ActionCard
            iconName="Plus"
            title={t('quickActions.createAppointment')}
            description={t('quickActions.addNewBooking')}
            href="/dashboard/appointments/new"
            variant="default"
          />

          {/* View Calendar Card */}
          <ActionCard
            iconName="CalendarClock"
            title={t('quickActions.viewCalendar')}
            description={t('quickActions.manageBookings')}
            href="/dashboard/appointments"
            iconColor="text-blue-600"
          />

          {/* Share Booking Form Card */}
          <ShareActionCard />
        </div>
      </div>

      <DashboardHeader
        heading={
          <span className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            {t('overview')}
          </span>
        }
        text={t('trackPerformance')}
      />

      {/* Main Content */}
      <div className="space-y-6">

        {/* Dashboard Overview with Charts */}
        <DashboardOverview appointments={appointments || []} />

      </div>
    </DashboardShell>
  );
}
