"use client";

import { AppointmentTypeSettings } from "@/components/settings/appointment-type-settings";

export default function AppointmentTypeSettingsPage({ params }: { params: { id: string } }) {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Appointment Type Settings</h1>
      <AppointmentTypeSettings typeId={params.id} />
    </div>
  );
}
