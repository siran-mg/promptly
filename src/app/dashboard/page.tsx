import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { SmartShareButton } from "@/components/dashboard/smart-share-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  Plus,
  Share,
  Settings,
  Sparkles,
  BookOpen,
  BarChart3,
  Palette
} from "lucide-react";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

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
            Welcome to Your Booking Hub
          </span>
        </h1>
        <p className="text-muted-foreground mb-6">Everything you need to manage your appointments in one place</p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button variant="default" size="lg" className="h-28 flex flex-col items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all duration-200" asChild>
            <Link href="/dashboard/appointments/new">
              <Plus className="h-7 w-7 mb-1" />
              <div className="text-center">
                <div className="font-medium text-base">Create Appointment</div>
                <div className="text-xs opacity-90">Add a new booking to your schedule</div>
              </div>
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-28 flex flex-col items-center justify-center gap-2 bg-white shadow-sm hover:bg-gray-50 transition-all duration-200" asChild>
            <Link href="/dashboard/appointments">
              <CalendarClock className="h-7 w-7 mb-1 text-blue-600" />
              <div className="text-center">
                <div className="font-medium text-base">Calendar View</div>
                <div className="text-xs text-muted-foreground">See and manage all your bookings</div>
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
              <div className="font-medium text-base">Share Your Form</div>
              <div className="text-xs text-muted-foreground">Let clients book appointments online</div>
            </div>
          </div>
          <Button variant="outline" size="lg" className="h-28 flex flex-col items-center justify-center gap-2 bg-white shadow-sm hover:bg-gray-50 transition-all duration-200" asChild>
            <Link href="/dashboard/settings?tab=form">
              <Palette className="h-7 w-7 mb-1 text-purple-600" />
              <div className="text-center">
                <div className="font-medium text-base">Design Your Form</div>
                <div className="text-xs text-muted-foreground">Customize colors, logo and fields</div>
              </div>
            </Link>
          </Button>
        </div>
      </div>

      <DashboardHeader
        heading={
          <span className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            Your Business at a Glance
          </span>
        }
        text="Track performance metrics and upcoming appointments"
      />

      {/* Main Content */}
      <div className="space-y-6">

        {/* Dashboard Overview with Charts */}
        <DashboardOverview appointments={appointments || []} />

        {/* Additional Resources */}
        <div className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                Quick Tips & Resources
              </CardTitle>
              <CardDescription>
                Helpful guides to get the most out of Promptly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <CalendarClock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Efficient Schedule Management</h3>
                    <p className="text-sm text-muted-foreground">Learn time-saving techniques for managing your calendar and reducing no-shows.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Share className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Maximizing Form Conversions</h3>
                    <p className="text-sm text-muted-foreground">Design tips to create booking forms that attract more clients and increase conversion rates.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Palette className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Form Customization Guide</h3>
                    <p className="text-sm text-muted-foreground">Step-by-step instructions for creating beautiful, branded booking forms that impress clients.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
