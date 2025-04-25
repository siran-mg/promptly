"use client";


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Database } from "@/types/supabase";
import { useTranslations } from "next-intl";
import { useDateFormatter } from "@/hooks/use-date-formatter";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface RecentAppointmentsProps {
  appointments: Appointment[];
}

export function RecentAppointments({ appointments }: RecentAppointmentsProps) {
  const t = useTranslations();
  const { formatDate, formatTime } = useDateFormatter();
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
            {t('dashboard.upcomingBookings')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.upcomingDescription')}
          </CardDescription>
        </div>
        <Link href="/dashboard/appointments">
          <Button variant="outline" size="sm" className="ml-auto hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
            {t('dashboard.viewCalendar')}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.noUpcomingAppointments')}</p>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 hover:bg-gray-50 p-2 rounded-md transition-colors">
                <div className="space-y-1">
                  <p className="font-medium">{appointment.client_name}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="font-medium text-indigo-600">{formatDate(new Date(appointment.date), { shortDate: true })}</span>
                    <span className="mx-1">•</span>
                    <span>{formatTime(new Date(appointment.date))}</span>
                  </div>
                </div>
                <AppointmentStatusBadge status={appointment.status} />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
