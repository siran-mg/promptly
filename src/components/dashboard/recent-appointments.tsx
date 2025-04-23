"use client";

import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Database } from "@/types/supabase";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface RecentAppointmentsProps {
  appointments: Appointment[];
}

export function RecentAppointments({ appointments }: RecentAppointmentsProps) {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Appointments</CardTitle>
          <CardDescription>
            Your most recent upcoming appointments
          </CardDescription>
        </div>
        <Link href="/dashboard/appointments">
          <Button variant="outline" size="sm" className="ml-auto">
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-medium">{appointment.client_name}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>{format(new Date(appointment.date), "PPP p")}</span>
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
