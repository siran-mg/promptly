"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Share, Loader2, Settings, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { ShareDialog } from "@/components/share/share-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SmartShareButtonProps {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  iconOnly?: boolean;
}

export function SmartShareButton({
  variant = "outline",
  size = "default",
  className = "",
  iconOnly = false
}: SmartShareButtonProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  // Fetch appointment types when the dialog opens
  useEffect(() => {
    if (isShareDialogOpen) {
      fetchAppointmentTypes();
    }
  }, [isShareDialogOpen]);

  const fetchAppointmentTypes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: typesData, error: typesError } = await supabase
        .from("appointment_types")
        .select("*")
        .eq("user_id", user.id)
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

  // Handle button click
  const handleClick = async () => {
      setIsShareDialogOpen(true);
  };

  // Handle customize form button
  const handleCustomizeForm = () => {
    router.push('/dashboard/settings?tab=form');
    setIsShareDialogOpen(false);
  };

  return (
    <>
      <div onClick={handleClick} className={className}>
        {/* The button is now just a div that triggers the dialog */}
      </div>

      {/* Share dialog for customized forms */}
      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        appointmentTypes={appointmentTypes}
        onCustomizeForm={handleCustomizeForm}
      />
    </>
  );
}
