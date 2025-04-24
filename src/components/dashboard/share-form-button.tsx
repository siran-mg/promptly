"use client";

import { useState, useEffect } from "react";
import { Share } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { ShareDialog } from "@/components/share/share-dialog";
import { useRouter } from "next/navigation";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";

interface ShareFormButtonProps {
  userId: string;
  className?: string;
}

export function ShareFormButton({ userId, className }: ShareFormButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);

  // Fetch appointment types when the dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchAppointmentTypes();
    }
  }, [isOpen]);

  const fetchAppointmentTypes = async () => {
    try {
      const { data: typesData, error: typesError } = await supabase
        .from("appointment_types")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("name");

      if (typesError) {
        console.error("Error fetching appointment types:", typesError);
      } else {
        setAppointmentTypes(typesData || []);
      }
    } catch (err) {
      console.error("Error fetching appointment types:", err);
    }
  };

  const handleCustomizeForm = () => {
    router.push('/dashboard/settings?tab=form');
    setIsOpen(false);
  };

  return (
    <>
      <PrimaryActionButton
        onClick={() => setIsOpen(true)}
        icon={Share}
        variant={className?.includes('indigo') ? 'indigo' : 'default'}
        className={className || ''}
      >
        Share Booking Form
      </PrimaryActionButton>

      <ShareDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        appointmentTypes={appointmentTypes}
        onCustomizeForm={handleCustomizeForm}
      />
    </>
  );
}
