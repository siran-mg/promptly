"use client";

import { StatsOverview } from "@/components/dashboard/stats-overview";
import { AppointmentsByStatusChart } from "@/components/dashboard/appointments-by-status-chart";
import { AppointmentsByMonthChart } from "@/components/dashboard/appointments-by-month-chart";
import { RecentAppointments } from "@/components/dashboard/recent-appointments";
import { Database } from "@/types/supabase";
import { startOfMonth, parseISO, isFuture, isToday } from "date-fns";
import { useDateFormatter } from "@/hooks/use-date-formatter";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface DashboardOverviewProps {
  appointments: Appointment[];
}

export function DashboardOverview({ appointments }: DashboardOverviewProps) {
  const { formatMonthYear } = useDateFormatter();

  // Calculate stats
  const totalAppointments = appointments.length;

  const upcomingAppointments = appointments.filter(
    app => isFuture(parseISO(app.date)) || isToday(parseISO(app.date))
  ).length;

  // Get unique clients
  const uniqueClients = new Set(
    appointments.map(app => `${app.client_email}-${app.client_phone}`)
  );
  const totalClients = uniqueClients.size;

  // Calculate completion rate
  const completedAppointments = appointments.filter(
    app => app.status === "completed"
  ).length;

  const pastAppointments = appointments.filter(
    app => !isFuture(parseISO(app.date)) && !isToday(parseISO(app.date))
  ).length;

  const completionRate = pastAppointments > 0
    ? Math.round((completedAppointments / pastAppointments) * 100)
    : 0;

  // Prepare data for status chart
  const statusCounts = appointments.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count
  }));

  // Prepare data for monthly chart with original dates for sorting
  const monthsWithDates: { date: Date; formattedMonth: string; count: number }[] = [];

  appointments.forEach(app => {
    const date = parseISO(app.date);
    // Create a date object for the first day of the month
    const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const formattedMonth = formatMonthYear(date);

    // Find existing entry or create new one
    const existingEntry = monthsWithDates.find(
      entry => entry.date.getFullYear() === monthDate.getFullYear() &&
               entry.date.getMonth() === monthDate.getMonth()
    );

    if (existingEntry) {
      existingEntry.count++;
    } else {
      monthsWithDates.push({
        date: monthDate,
        formattedMonth,
        count: 1
      });
    }
  });

  // Sort by date and map to the format expected by the chart
  const monthlyChartData = monthsWithDates
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(item => ({
      month: item.formattedMonth,
      count: item.count
    }));

  // Get recent upcoming appointments
  const recentAppointments = appointments
    .filter(app => isFuture(parseISO(app.date)) || isToday(parseISO(app.date)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <StatsOverview
        totalAppointments={totalAppointments}
        upcomingAppointments={upcomingAppointments}
        totalClients={totalClients}
        completionRate={completionRate}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AppointmentsByMonthChart data={monthlyChartData} />
        <AppointmentsByStatusChart data={statusData} />
      </div>
      
      <RecentAppointments appointments={recentAppointments} />
    </div>
  );
}
