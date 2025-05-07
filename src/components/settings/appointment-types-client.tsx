"use client";

import { useRouter } from "next/navigation";
import { AppointmentTypes } from "@/components/settings/appointment-types";

export function AppointmentTypesClient() {
  const router = useRouter();
  
  return (
    <AppointmentTypes
      onSelectType={(typeId) => {
        router.push(`/dashboard/appointment-types/${typeId}`);
      }}
    />
  );
}
