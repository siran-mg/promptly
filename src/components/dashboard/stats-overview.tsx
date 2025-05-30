"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Users, CheckCircle, Clock, Calendar, UserCheck, Award, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface StatsOverviewProps {
  totalAppointments: number;
  upcomingAppointments: number;
  totalClients: number;
  completionRate: number;
}

export function StatsOverview({
  totalAppointments,
  upcomingAppointments,
  totalClients,
  completionRate,
}: StatsOverviewProps) {
  const t = useTranslations();
  return (
    <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
      <Card className="overflow-hidden border-indigo-100 hover:shadow-md transition-all duration-200">
        <div className="h-1 bg-indigo-600"></div>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4">
            <div className="bg-indigo-100 p-2 md:p-3 rounded-full mb-3 sm:mb-0">
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">{t('dashboard.stats.totalBookings')}</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl md:text-3xl font-bold">{totalAppointments}</h3>
                <span className="text-xs text-muted-foreground">{t('dashboard.stats.appointments')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-blue-100 hover:shadow-md transition-all duration-200">
        <div className="h-1 bg-blue-600"></div>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4">
            <div className="bg-blue-100 p-2 md:p-3 rounded-full mb-3 sm:mb-0">
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">{t('dashboard.stats.comingUp')}</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl md:text-3xl font-bold">{upcomingAppointments}</h3>
                <span className="text-xs text-muted-foreground">{t('dashboard.stats.scheduled')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-green-100 hover:shadow-md transition-all duration-200">
        <div className="h-1 bg-green-600"></div>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4">
            <div className="bg-green-100 p-2 md:p-3 rounded-full mb-3 sm:mb-0">
              <UserCheck className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">{t('dashboard.stats.clientBase')}</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl md:text-3xl font-bold">{totalClients}</h3>
                <span className="text-xs text-muted-foreground">{t('dashboard.stats.uniqueClients')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-amber-100 hover:shadow-md transition-all duration-200">
        <div className="h-1 bg-amber-600"></div>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4">
            <div className="bg-amber-100 p-2 md:p-3 rounded-full mb-3 sm:mb-0">
              <Award className="h-6 w-6 md:h-8 md:w-8 text-amber-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">{t('dashboard.stats.successRate')}</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl md:text-3xl font-bold">{completionRate}%</h3>
                <span className="text-xs text-muted-foreground">{t('dashboard.stats.completed')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
