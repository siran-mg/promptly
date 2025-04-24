"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2, Share, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareDialog } from "@/components/share/share-dialog";
import { DeleteAppointmentTypeDialog } from "./delete-appointment-type-dialog";

import { Database } from "@/types/supabase";

type AppointmentType = Database["public"]["Tables"]["appointment_types"]["Row"];

export function AppointmentTypeSettings({ typeId }: { typeId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentType, setAppointmentType] = useState<AppointmentType | null>(null);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);

  // Fetch appointment type and all types
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch the specific appointment type
        const { data: typeData, error: typeError } = await supabase
          .from("appointment_types")
          .select("*")
          .eq("id", typeId)
          .eq("user_id", user.id)
          .single();

        if (typeError) {
          console.error("Error fetching appointment type:", typeError);
          toast({
            title: "Error",
            description: "Could not load appointment type. Please try again.",
            variant: "destructive",
          });
          router.push("/dashboard/settings?tab=appointment-typess");
          return;
        }

        setAppointmentType(typeData);

        // Fetch all appointment types for the share dialog
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
        console.error("Error in fetchData:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, supabase, toast, typeId]);



  // Handle customize form button
  const handleCustomizeForm = () => {
    router.push(`/dashboard/settings?tab=appointment-typess/${typeId}/form`);
    setIsShareDialogOpen(false);
  };

  // Open share dialog
  const handleOpenShareDialog = () => {
    setIsShareDialogOpen(true);
  };

  if (isLoading || !appointmentType) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/settings?tab=appointment-typess")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Appointment Types
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/settings?tab=appointment-typess/${typeId}/edit`)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: appointmentType.color || '#6366f1' }}
            />
            <div>
              <CardTitle>{appointmentType.name}</CardTitle>
              <CardDescription>{appointmentType.duration} minutes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Description</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {appointmentType.description ? appointmentType.description : "No description provided."}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium">Status</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {appointmentType.is_default ? "Default appointment type" : "Regular appointment type"}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/settings?tab=appointment-typess/${typeId}/form`)}
          >
            Customize Form
          </Button>
          <Button onClick={handleOpenShareDialog} className="gap-2">
            <Share className="h-4 w-4" />
            Share Booking Link
          </Button>
        </CardFooter>
      </Card>

      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        appointmentTypes={appointmentTypes}
        defaultTypeId={appointmentType.id}
        onCustomizeForm={handleCustomizeForm}
      />

      <DeleteAppointmentTypeDialog
        appointmentType={appointmentType}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDeleteSuccess={() => {
          router.push("/dashboard/settings?tab=appointment-typess");
        }}
      />
    </div>
  );
}
