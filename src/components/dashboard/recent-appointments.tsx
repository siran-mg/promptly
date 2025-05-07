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
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
            {t('dashboard.upcomingBookings')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('dashboard.upcomingDescription')}
          </CardDescription>
        </div>
        <Link href="/dashboard/appointments" className="w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            {t('dashboard.viewCalendar')}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.noUpcomingAppointments')}</p>
          ) : (
            appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between border-b pb-3 sm:pb-4 last:border-0 last:pb-0 hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1 mr-2">
                  <p className="font-medium text-sm sm:text-base truncate">{appointment.client_name}</p>
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <span className="font-medium text-indigo-600 whitespace-nowrap">{formatDate(new Date(appointment.date), { shortDate: true })}</span>
                    <span className="mx-1">•</span>
                    <span className="whitespace-nowrap">{formatTime(new Date(appointment.date))}</span>
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
