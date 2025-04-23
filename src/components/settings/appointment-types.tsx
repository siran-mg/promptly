"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Pencil, Trash2, Check, X, Star, StarOff } from "lucide-react";
import { Database } from "@/types/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AppointmentType = Database["public"]["Tables"]["appointment_types"]["Row"];

interface AppointmentTypesProps {
  onSelectType?: (typeId: string) => void;
}

export function AppointmentTypes({ onSelectType }: AppointmentTypesProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<AppointmentType | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "60",
    color: "#6366f1",
    is_default: false,
  });

  // Fetch appointment types
  useEffect(() => {
    const fetchAppointmentTypes = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("appointment_types")
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false })
          .order("name");

        if (error) {
          console.error("Error fetching appointment types:", error);
          toast({
            title: "Error",
            description: "Could not load appointment types. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setAppointmentTypes(data || []);

        // If no appointment types exist, create a default one
        if (data.length === 0) {
          createDefaultAppointmentType(user.id);
        }
      } catch (err) {
        console.error("Error in fetchAppointmentTypes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointmentTypes();
  }, [supabase, router, toast]);

  // Create a default appointment type
  const createDefaultAppointmentType = async (userId: string) => {
    try {
      setIsSaving(true);
      const { data, error } = await supabase
        .from("appointment_types")
        .insert({
          user_id: userId,
          name: "Standard Appointment",
          description: "Default appointment type",
          duration: 60,
          color: "#6366f1",
          is_default: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating default appointment type:", error);
        return;
      }

      setAppointmentTypes([data]);
      toast({
        title: "Default appointment type created",
        description: "A standard appointment type has been created for you.",
      });
    } catch (err) {
      console.error("Error in createDefaultAppointmentType:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Open dialog to add a new appointment type
  const handleAddNew = () => {
    setFormData({
      name: "",
      description: "",
      duration: "60",
      color: "#6366f1",
      is_default: false,
    });
    setEditingType(null);
    setIsDialogOpen(true);
  };

  // Open dialog to edit an existing appointment type
  const handleEdit = (type: AppointmentType) => {
    setFormData({
      name: type.name,
      description: type.description || "",
      duration: type.duration.toString(),
      color: type.color || "#6366f1",
      is_default: type.is_default,
    });
    setEditingType(type);
    setIsDialogOpen(true);
  };

  // Open dialog to confirm deletion
  const handleDeleteClick = (type: AppointmentType) => {
    setTypeToDelete(type);
    setIsDeleteDialogOpen(true);
  };

  // Set an appointment type as default
  const handleSetDefault = async (type: AppointmentType) => {
    try {
      // First, remove default status from all types
      const { error: updateError } = await supabase
        .from("appointment_types")
        .update({ is_default: false })
        .eq("user_id", type.user_id);

      if (updateError) {
        console.error("Error updating appointment types:", updateError);
        return;
      }

      // Then set the selected type as default
      const { error } = await supabase
        .from("appointment_types")
        .update({ is_default: true })
        .eq("id", type.id);

      if (error) {
        console.error("Error setting default appointment type:", error);
        return;
      }

      // Update local state
      setAppointmentTypes(prev =>
        prev.map(t => ({
          ...t,
          is_default: t.id === type.id
        }))
      );

      toast({
        title: "Default updated",
        description: `"${type.name}" is now your default appointment type.`,
      });
    } catch (err) {
      console.error("Error in handleSetDefault:", err);
    }
  };

  // Delete an appointment type
  const handleDelete = async () => {
    if (!typeToDelete) return;

    try {
      // Check if this is the default type
      if (typeToDelete.is_default) {
        toast({
          title: "Cannot delete default type",
          description: "Please set another type as default before deleting this one.",
          variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
        return;
      }

      // Check if this type is used by any appointments
      const { count, error: countError } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("appointment_type_id", typeToDelete.id);

      if (countError) {
        console.error("Error checking appointments:", countError);
        return;
      }

      if (count && count > 0) {
        toast({
          title: "Cannot delete",
          description: `This appointment type is used by ${count} appointment(s). Please reassign them first.`,
          variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
        return;
      }

      // Delete custom fields associated with this type
      const { error: fieldsError } = await supabase
        .from("appointment_custom_fields")
        .delete()
        .eq("appointment_type_id", typeToDelete.id);

      if (fieldsError) {
        console.error("Error deleting custom fields:", fieldsError);
        // Continue anyway
      }

      // Delete the appointment type
      const { error } = await supabase
        .from("appointment_types")
        .delete()
        .eq("id", typeToDelete.id);

      if (error) {
        console.error("Error deleting appointment type:", error);
        toast({
          title: "Error",
          description: "Could not delete appointment type. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setAppointmentTypes(prev => prev.filter(t => t.id !== typeToDelete.id));

      toast({
        title: "Appointment type deleted",
        description: "The appointment type has been deleted successfully.",
      });
    } catch (err) {
      console.error("Error in handleDelete:", err);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Save a new or edited appointment type
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const appointmentTypeData = {
        name: formData.name,
        description: formData.description || null,
        duration: parseInt(formData.duration),
        color: formData.color,
        is_default: formData.is_default,
      };

      if (editingType) {
        // If setting this as default, first remove default from all others
        if (formData.is_default && !editingType.is_default) {
          const { error: updateError } = await supabase
            .from("appointment_types")
            .update({ is_default: false })
            .eq("user_id", user.id);

          if (updateError) {
            console.error("Error updating appointment types:", updateError);
          }
        }

        // Update existing appointment type
        const { data, error } = await supabase
          .from("appointment_types")
          .update(appointmentTypeData)
          .eq("id", editingType.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Update local state
        setAppointmentTypes(prev =>
          prev.map(type => type.id === editingType.id ? data :
            // If this is now the default, make sure others are not
            formData.is_default ? { ...type, is_default: false } : type
          )
        );

        toast({
          title: "Appointment type updated",
          description: "Your appointment type has been updated successfully.",
        });
      } else {
        // If setting this as default, first remove default from all others
        if (formData.is_default) {
          const { error: updateError } = await supabase
            .from("appointment_types")
            .update({ is_default: false })
            .eq("user_id", user.id);

          if (updateError) {
            console.error("Error updating appointment types:", updateError);
          }
        }

        // Create new appointment type
        const { data, error } = await supabase
          .from("appointment_types")
          .insert({
            ...appointmentTypeData,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Update local state
        setAppointmentTypes(prev => {
          const newTypes = [...prev, data];
          // If this is the default, make sure others are not
          if (formData.is_default) {
            return newTypes.map(type => ({
              ...type,
              is_default: type.id === data.id
            }));
          }
          return newTypes;
        });

        toast({
          title: "Appointment type created",
          description: "Your new appointment type has been created successfully.",
        });
      }

      // Close dialog and reset form
      setIsDialogOpen(false);
      setEditingType(null);
    } catch (err: any) {
      console.error("Error saving appointment type:", err);
      toast({
        title: "Save failed",
        description: err?.message || "Could not save appointment type. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Appointment Types</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage different types of appointments with custom durations and fields.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Type
        </Button>
      </div>

      {appointmentTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <p className="text-muted-foreground mb-4">No appointment types found.</p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Appointment Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointmentTypes.map((type) => (
                  <TableRow
                    key={type.id}
                    className={onSelectType ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={() => onSelectType && onSelectType(type.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {type.color && (
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: type.color }}
                          />
                        )}
                        {type.name}
                      </div>
                    </TableCell>
                    <TableCell>{type.duration} minutes</TableCell>
                    <TableCell>
                      {type.is_default ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <Check className="h-3 w-3 mr-1" />
                          Default
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(type)}
                          className="h-7 text-xs"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Set as default
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(type)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(type)}
                          className="h-8 w-8 p-0"
                          disabled={type.is_default}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog for adding/editing appointment types */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Edit Appointment Type" : "Add Appointment Type"}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? "Update the details of this appointment type."
                : "Create a new type of appointment with custom duration."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Initial Consultation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe what this appointment type is for"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    id="color_text"
                    name="color"
                    type="text"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => handleCheckboxChange("is_default", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="is_default" className="text-sm font-medium">
                  Set as default appointment type
                </Label>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : editingType ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for deletion */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the appointment type
              {typeToDelete && <strong> "{typeToDelete.name}"</strong>}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
