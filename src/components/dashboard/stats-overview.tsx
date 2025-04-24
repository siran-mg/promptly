"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Users, CheckCircle, Clock, Calendar, UserCheck, Award, TrendingUp } from "lucide-react";

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
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="overflow-hidden border-indigo-100 hover:shadow-md transition-all duration-200">
        <div className="h-1 bg-indigo-600"></div>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Calendar className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold">{totalAppointments}</h3>
                <span className="text-xs text-muted-foreground">appointments</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-blue-100 hover:shadow-md transition-all duration-200">
        <div className="h-1 bg-blue-600"></div>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Coming Up</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold">{upcomingAppointments}</h3>
                <span className="text-xs text-muted-foreground">scheduled</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-green-100 hover:shadow-md transition-all duration-200">
        <div className="h-1 bg-green-600"></div>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-full">
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Client Base</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold">{totalClients}</h3>
                <span className="text-xs text-muted-foreground">unique clients</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-amber-100 hover:shadow-md transition-all duration-200">
        <div className="h-1 bg-amber-600"></div>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <Award className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold">{completionRate}%</h3>
                <span className="text-xs text-muted-foreground">completed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
