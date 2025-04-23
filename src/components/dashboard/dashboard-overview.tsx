"use client";

import { StatsOverview } from "@/components/dashboard/stats-overview";
import { AppointmentsByStatusChart } from "@/components/dashboard/appointments-by-status-chart";
import { AppointmentsByMonthChart } from "@/components/dashboard/appointments-by-month-chart";
import { RecentAppointments } from "@/components/dashboard/recent-appointments";
import { Database } from "@/types/supabase";
import { startOfMonth, format, parseISO, isFuture, isToday } from "date-fns";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface DashboardOverviewProps {
  appointments: Appointment[];
}

export function DashboardOverview({ appointments }: DashboardOverviewProps) {
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
  
  // Prepare data for monthly chart
  const monthlyData = appointments.reduce((acc, app) => {
    const date = parseISO(app.date);
    const monthKey = format(date, "MMM yyyy");
    
    if (!acc[monthKey]) {
      acc[monthKey] = 0;
    }
    
    acc[monthKey]++;
    return acc;
  }, {} as Record<string, number>);
  
  // Convert to array and sort by month
  const monthlyChartData = Object.entries(monthlyData)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => {
      // Sort by date (assuming format is "MMM yyyy")
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  
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
        <RecentAppointments appointments={recentAppointments} />
      </div>
    </div>
  );
}
