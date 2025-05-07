import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/app/i18n";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { SmartShareButton } from "@/components/dashboard/smart-share-button";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  Plus,
  Share,
  Sparkles,
  BarChart3,
  Palette
} from "lucide-react";

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
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 -mx-6 px-6 py-8 mb-8 border-b">
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          <span className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600" />
            {t('welcomeBack')}
          </span>
        </h1>
        <p className="text-muted-foreground mb-6">
          {t('manageAppointments')}
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button variant="default" size="lg" className="h-28 flex flex-col items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all duration-200" asChild>
            <Link href="/dashboard/appointments/new">
              <Plus className="h-7 w-7 mb-1" />
              <div className="text-center">
                <div className="font-medium text-base">{t('quickActions.createAppointment')}</div>
                <div className="text-xs opacity-90">{t('quickActions.addNewBooking')}</div>
              </div>
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-28 flex flex-col items-center justify-center gap-2 bg-white shadow-sm hover:bg-gray-50 transition-all duration-200" asChild>
            <Link href="/dashboard/appointments">
              <CalendarClock className="h-7 w-7 mb-1 text-blue-600" />
              <div className="text-center">
                <div className="font-medium text-base">{t('quickActions.viewCalendar')}</div>
                <div className="text-xs text-muted-foreground">{t('quickActions.manageBookings')}</div>
              </div>
            </Link>
          </Button>
          <div className="relative h-28 flex flex-col items-center justify-center gap-2 bg-white shadow-sm rounded-md border hover:bg-gray-50 transition-all duration-200 cursor-pointer group">
            {/* Invisible button that covers the entire card for accessibility */}
            <div className="absolute inset-0 w-full h-full">
              <SmartShareButton variant="ghost" className="w-full h-full opacity-0" />
            </div>

            {/* Visual content */}
            <Share className="h-7 w-7 mb-1 text-green-600 group-hover:text-green-700" />
            <div className="text-center mt-1">
              <div className="font-medium text-base">{t('quickActions.shareBookingForm')}</div>
              <div className="text-xs text-muted-foreground">{t('quickActions.shareBookingFormDescription')}</div>
            </div>
          </div>
          <Button variant="outline" size="lg" className="h-28 flex flex-col items-center justify-center gap-2 bg-white shadow-sm hover:bg-gray-50 transition-all duration-200" asChild>
            <Link href="/dashboard/settings?tab=form">
              <Palette className="h-7 w-7 mb-1 text-purple-600" />
              <div className="text-center">
                <div className="font-medium text-base">{t('quickActions.customizeBookingForm')}</div>
                <div className="text-xs text-muted-foreground">{t('quickActions.customizeBookingFormDescription')}</div>
              </div>
            </Link>
          </Button>
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
