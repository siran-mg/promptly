"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define a client type based on appointments
type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  appointmentsCount: number;
  lastAppointment: string | null;
};

interface EditClientDialogProps {
  client: Client | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateSuccess: () => void;
}

export function EditClientDialog({
  client,
  isOpen,
  onOpenChange,
  onUpdateSuccess,
}: EditClientDialogProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Initialize form data when client or dialog open state changes
  useEffect(() => {
    if (client && isOpen) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
      });
    }
  }, [client, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsUpdating(true);
    try {
      // Find all appointments for this client
      const { data: appointments, error: fetchError } = await supabase
        .from("appointments")
        .select("id")
        .eq("client_email", client.email)
        .eq("client_phone", client.phone);

      if (fetchError) {
        throw fetchError;
      }

      if (appointments && appointments.length > 0) {
        // Update all appointments for this client
        const appointmentIds = appointments.map(app => app.id);

        const { error: updateError } = await supabase
          .from("appointments")
          .update({
            client_name: formData.name,
            client_email: formData.email,
            client_phone: formData.phone,
          })
          .in("id", appointmentIds);

        if (updateError) {
          throw updateError;
        }
      }

      toast({
        title: "Client updated",
        description: `${client.name} has been successfully updated.`,
      });

      // Call the success callback to update the UI
      onUpdateSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error updating client:", err);
      toast({
        title: "Error",
        description: err?.message || "Could not update client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update client information. This will update all appointments for this client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
