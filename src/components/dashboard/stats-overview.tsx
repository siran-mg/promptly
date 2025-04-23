"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Users, CheckCircle, Clock } from "lucide-react";

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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <CalendarClock className="h-10 w-10 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
              <h3 className="text-3xl font-bold">{totalAppointments}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-10 w-10 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
              <h3 className="text-3xl font-bold">{upcomingAppointments}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Users className="h-10 w-10 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
              <h3 className="text-3xl font-bold">{totalClients}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-10 w-10 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
              <h3 className="text-3xl font-bold">{completionRate}%</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
