import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/app/i18n";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { AppointmentsCalendarClient } from "@/components/appointments/appointments-calendar-client";
import { Button } from "@/components/ui/button";
import {
  Plus,
  List,
  Calendar,
  CalendarClock
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AppointmentsPage({
  params: { locale },
  searchParams
}: {
  params: { locale: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const t = await getTranslations({ locale, namespace: "appointments" });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Extract filter parameters
  const typeParam = searchParams.type as string;
  const fieldName = searchParams.field as string;

  // Parse type IDs (could be a single ID or a comma-separated list)
  const typeIds = typeParam ? typeParam.split(',') : [];

  // Build the query
  let query = supabase
    .from("appointments")
    .select(`
      *,
      appointment_type:appointment_type_id(id, name, color),
      field_values:appointment_field_values(id, field_id, value)
    `);

  // Apply filters if provided
  if (typeIds.length === 1) {
    // If only one type is selected, use eq
    query = query.eq('appointment_type_id', typeIds[0]);
  } else if (typeIds.length > 1) {
    // If multiple types are selected, use in
    query = query.in('appointment_type_id', typeIds);
  }

  // Order by date
  query = query.order("date", { ascending: false });

  // Execute the query
  const { data: appointments, error } = await query;

  if (error) {
    console.error("Error fetching appointments:", error);
  }

  // Fetch appointment types for filtering
  const { data: appointmentTypes, error: typesError } = await supabase
    .from("appointment_types")
    .select("id, name, color, duration")
    .order("name");

  if (typesError) {
    console.error("Error fetching appointment types:", typesError);
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={
          <span className="flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-indigo-600" />
            {t("title")}
          </span>
        }
        text={t("description")}
      >
        <Link href="/dashboard/appointments/new">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 transition-colors">
            <Plus className="mr-2 h-4 w-4" />
            {t("new")}
          </Button>
        </Link>
      </DashboardHeader>
      <div className="mt-6">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 p-1">
            <TabsTrigger value="calendar" className="flex items-center gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <Calendar className="h-4 w-4" />
              {t("calendar")}
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <List className="h-4 w-4" />
              {t("list")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="space-y-4">
            <AppointmentsCalendarClient
              appointments={appointments || []}
              appointmentTypes={appointmentTypes || []}
              activeTypeId={typeParam}
              activeFieldName={fieldName}
            />
          </TabsContent>
          <TabsContent value="list" className="space-y-4">
            <AppointmentsTable
              appointments={appointments || []}
              appointmentTypes={appointmentTypes || []}
              activeTypeId={typeParam}
              activeFieldName={fieldName}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
