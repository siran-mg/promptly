"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { ShareDialog } from "@/components/share/share-dialog";
import { useRouter } from "next/navigation";

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
    router.push('/dashboard/settings?tab=customize');
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className={`gap-2 text-white ${className || ''}`}
      >
        <Share className="h-4 w-4" />
        Share Booking Form
      </Button>

      <ShareDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        appointmentTypes={appointmentTypes}
        onCustomizeForm={handleCustomizeForm}
      />
    </>
  );
}
