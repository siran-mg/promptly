import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ClientsTable } from "@/components/clients/clients-table";
import { AddClientButton } from "@/components/clients/add-client-button";
import { Users, UserPlus } from "lucide-react";

export default async function ClientsPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch all appointments for the current user
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", session.user.id)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching appointments:", error);
  }

  // Process appointments to extract unique clients
  const clientsMap = new Map();

  appointments?.forEach(appointment => {
    const clientId = `${appointment.client_email}-${appointment.client_phone}`;

    if (!clientsMap.has(clientId)) {
      clientsMap.set(clientId, {
        id: clientId,
        name: appointment.client_name,
        email: appointment.client_email,
        phone: appointment.client_phone,
        appointmentsCount: 1,
        lastAppointment: appointment.date
      });
    } else {
      const client = clientsMap.get(clientId);
      client.appointmentsCount += 1;

      // Update last appointment if this one is more recent
      const currentLastDate = new Date(client.lastAppointment);
      const newDate = new Date(appointment.date);

      if (newDate > currentLastDate) {
        client.lastAppointment = appointment.date;
      }
    }
  });

  const clients = Array.from(clientsMap.values());

  return (
    <DashboardShell>
      <DashboardHeader
        heading={
          <span className="flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Your Client Directory
          </span>
        }
        text="View, manage, and track all your client relationships in one place"
      >
        <AddClientButton />
      </DashboardHeader>
      <div className="mt-6">
        <ClientsTable clients={clients} />
      </div>
    </DashboardShell>
  );
}
