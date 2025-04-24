"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Pencil, Trash2, Check, X, Star, StarOff, Clock } from "lucide-react";
import { Database } from "@/types/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
import { DeleteAppointmentTypeDialog } from "./delete-appointment-type-dialog";

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
  const [appointmentsUsingType, setAppointmentsUsingType] = useState<any[]>([]);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [reassignTargetTypeId, setReassignTargetTypeId] = useState<string>("");
  const [isReassigning, setIsReassigning] = useState(false);

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

      // Open the edit dialog for the newly created default type
      handleEdit(data);
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

    // Show a notification if this is the default appointment type with the generic name
    if (type.is_default && type.name === "Standard Appointment") {
      toast({
        title: "Personalize your appointment type",
        description: "We recommend renaming the default appointment type to match your business needs.",
        variant: "default",
      });
    }
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

  // Helper function to delete an appointment type
  const deleteAppointmentType = async () => {
    if (!typeToDelete) {
      console.log("No typeToDelete found");
      return false;
    }

    console.log("Attempting to delete appointment type:", typeToDelete.id, typeToDelete.name);

    try {
      // Delete custom fields associated with this type
      console.log("Deleting custom fields for type:", typeToDelete.id);
      const { error: fieldsError } = await supabase
        .from("appointment_custom_fields")
        .delete()
        .eq("appointment_type_id", typeToDelete.id);

      if (fieldsError) {
        console.error("Error deleting custom fields:", fieldsError);
        // Continue anyway
      } else {
        console.log("Custom fields deleted successfully");
      }

      // Delete the appointment type
      console.log("Now deleting the appointment type itself:", typeToDelete.id);

      // First check if there are any appointment field values that reference custom fields for this type
      console.log("Checking for appointment field values that might be blocking deletion...");
      const { data: customFields } = await supabase
        .from("appointment_custom_fields")
        .select("id")
        .eq("appointment_type_id", typeToDelete.id);

      if (customFields && customFields.length > 0) {
        const fieldIds = customFields.map(field => field.id);
        console.log("Found custom fields:", fieldIds);

        // Delete any field values that reference these custom fields
        if (fieldIds.length > 0) {
          console.log("Deleting field values for these custom fields");
          const { error: fieldValuesError } = await supabase
            .from("appointment_field_values")
            .delete()
            .in("field_id", fieldIds);

          if (fieldValuesError) {
            console.error("Error deleting field values:", fieldValuesError);
          } else {
            console.log("Field values deleted successfully");
          }
        }
      }

      // Now try to delete the appointment type
      const { data, error } = await supabase
        .from("appointment_types")
        .delete()
        .eq("id", typeToDelete.id)
        .select();

      if (error) {
        console.error("Error deleting appointment type:", error);
        toast({
          title: "Error",
          description: "Could not delete appointment type. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      console.log("Deletion response:", data);

      // Update local state
      setAppointmentTypes(prev => {
        const filtered = prev.filter(t => t.id !== typeToDelete.id);
        console.log("Updated appointment types:", filtered.length, "(was", prev.length, ")");
        return filtered;
      });

      // Reset typeToDelete state
      setTimeout(() => {
        setTypeToDelete(null);
        console.log("Reset typeToDelete state");
      }, 100);

      toast({
        title: "Appointment type deleted",
        description: "The appointment type has been deleted successfully.",
      });

      return true;
    } catch (err) {
      console.error("Error in deleteAppointmentType:", err);
      return false;
    }
  };

  // Reassign appointments and then delete the appointment type
  const handleReassignAndDelete = async () => {
    if (!typeToDelete || !reassignTargetTypeId || appointmentsUsingType.length === 0) return;

    setIsReassigning(true);

    try {
      // Get the appointment IDs
      const appointmentIds = appointmentsUsingType.map(app => app.id);

      // Update all appointments to use the new type
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ appointment_type_id: reassignTargetTypeId })
        .in("id", appointmentIds);

      if (updateError) {
        console.error("Error reassigning appointments:", updateError);
        toast({
          title: "Error",
          description: "Could not reassign appointments. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Now delete the appointment type
      await deleteAppointmentType();

      // Show success message
      const targetType = appointmentTypes.find(t => t.id === reassignTargetTypeId);
      toast({
        title: "Appointments reassigned",
        description: `${appointmentsUsingType.length} appointment(s) reassigned to "${targetType?.name}" and the original type was deleted.`,
      });
    } catch (err) {
      console.error("Error in handleReassignAndDelete:", err);
    } finally {
      setIsReassigning(false);
      setIsReassignDialogOpen(false);
      setAppointmentsUsingType([]);
      setReassignTargetTypeId("");

      // Make sure to reset typeToDelete as well
      setTimeout(() => {
        setTypeToDelete(null);
        console.log("Reset typeToDelete state after reassign");
      }, 100);
    }
  };



  // Save a new or edited appointment type
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if the user is trying to save the default appointment type without renaming it
    if (editingType?.is_default && formData.name === "Standard Appointment") {
      toast({
        title: "Personalization required",
        description: "Please rename the default appointment type to something more specific for your business.",
        variant: "destructive",
      });
      return;
    }

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
                    className="cursor-pointer hover:bg-muted/50 group relative transition-colors"
                    onClick={() => onSelectType ? onSelectType(type.id) : router.push(`/dashboard/settings?tab=appointment-types&appointmentTypeId=${type.id}`)}
                    title="Click to manage custom fields and form settings"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {type.color && (
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: type.color }}
                          />
                        )}
                        <div>
                          <div className="flex items-center">
                            {type.name}
                            <span className="ml-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              (Click to manage custom fields and form settings)
                            </span>
                          </div>
                          {type.description && (
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          )}
                        </div>
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
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click event
                            handleSetDefault(type);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click event
                            router.push(`/dashboard/settings?tab=appointment-types&appointmentTypeId=${type.id}&view=form`);
                          }}
                          className="h-8 w-8 p-0 relative group"
                          title="Customize form settings for this appointment type"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"></path>
                            <path d="M18 14H4"></path>
                            <path d="M14 18v4"></path>
                            <path d="M8 6h.01"></path>
                            <path d="M12 6h.01"></path>
                            <path d="M16 6h.01"></path>
                          </svg>
                          <span className="sr-only">Form Settings</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click event
                            handleEdit(type);
                          }}
                          className="h-8 w-8 p-0 relative group"
                          title="Edit appointment type"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click event
                            handleDeleteClick(type);
                          }}
                          className="h-8 w-8 p-0 relative group"
                          disabled={type.is_default}
                          title={type.is_default ? "Cannot delete default type" : "Delete appointment type"}
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
              {editingType
                ? editingType.is_default
                  ? "Edit Default Appointment Type"
                  : "Edit Appointment Type"
                : "Add Appointment Type"}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? editingType.is_default
                  ? "Customize your default appointment type. This is the type that will be selected automatically when creating new appointments."
                  : "Update the details of this appointment type."
                : "Create a new type of appointment with custom duration."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-2">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Initial Consultation"
                      required
                      className={editingType?.is_default && formData.name === "Standard Appointment" ? "border-destructive" : ""}
                    />
                    {editingType?.is_default && formData.name === "Standard Appointment" && (
                      <p className="text-xs text-destructive mt-1">
                        Please personalize the default appointment type name for your business.
                      </p>
                    )}
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

                {/* Preview section */}
                <div className="border rounded-md p-4 space-y-4">
                  <h4 className="text-sm font-medium">Preview</h4>
                  <div className="border rounded-md p-3 bg-card">
                    <div className="flex items-center space-x-3">
                      {formData.color && (
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: formData.color }}
                        />
                      )}
                      <div>
                        <div className="font-medium">{formData.name || "Appointment Type"}</div>
                        {formData.description && (
                          <div className="text-sm text-muted-foreground">{formData.description}</div>
                        )}
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {formData.duration || 60} minutes
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mt-2">
                    This is how your appointment type will appear to clients in the booking form.
                  </div>

                  {formData.is_default && (
                    <div className="mt-4 text-xs bg-primary/10 text-primary p-2 rounded-md">
                      <div className="font-medium">Default Appointment Type</div>
                      <p>This type will be pre-selected when clients book appointments.</p>
                    </div>
                  )}
                </div>
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
      <DeleteAppointmentTypeDialog
        appointmentType={typeToDelete}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDeleteSuccess={() => {
          // Update local state
          if (typeToDelete) {
            setAppointmentTypes(prev => prev.filter(t => t.id !== typeToDelete.id));
          }
          setTypeToDelete(null);
        }}
        onCheckBeforeDelete={async (type) => {
          // Check if this is the default type and not the only type
          if (type.is_default && appointmentTypes.length > 1) {
            toast({
              title: "Cannot delete default type",
              description: "Please set another type as default before deleting this one.",
              variant: "destructive",
            });
            return false;
          }

          // Check if this type is used by any appointments
          const { data: appointmentsData, error: appointmentsError } = await supabase
            .from("appointments")
            .select("id, title, scheduled_for, client_name")
            .eq("appointment_type_id", type.id);

          if (appointmentsError) {
            console.error("Error checking appointments:", appointmentsError);
            return false;
          }

          if (appointmentsData && appointmentsData.length > 0) {
            setAppointmentsUsingType(appointmentsData);

            // Check if we have a lot of appointments - if so, offer a direct link instead of showing them all
            if (appointmentsData.length > 10) {
              toast({
                title: "Multiple appointments found",
                description: (
                  <div className="space-y-2">
                    <p>This appointment type is used by {appointmentsData.length} appointments.</p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white text-destructive hover:bg-gray-100 border border-destructive/20 font-medium"
                        onClick={() => {
                          router.push(`/dashboard/appointments?type=${type.id}`);
                          setIsDeleteDialogOpen(false);
                        }}
                      >
                        View All Appointments
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white text-primary hover:bg-gray-100 border border-primary/20 font-medium"
                        onClick={() => {
                          setIsReassignDialogOpen(true);
                          setIsDeleteDialogOpen(false);
                        }}
                      >
                        Reassign & Delete
                      </Button>
                    </div>
                  </div>
                ),
                variant: "destructive",
              });
              return false;
            }

            // For fewer appointments, show the reassign dialog
            setIsReassignDialogOpen(true);
            setIsDeleteDialogOpen(false);
            return false;
          }

          return true;
        }}
      />

      {/* Dialog for reassigning appointments */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reassign Appointments</DialogTitle>
            <DialogDescription>
              This appointment type is used by {appointmentsUsingType.length} appointment(s).
              Please select another appointment type to reassign them to before deleting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="bg-destructive/10 p-4 rounded-md border border-destructive">
              <h4 className="font-medium text-destructive mb-2">Appointments using this type:</h4>
              <div className="max-h-48 overflow-y-auto">
                <ul className="space-y-2">
                  {appointmentsUsingType.map(appointment => (
                    <li key={appointment.id} className="text-sm border-b pb-2">
                      <div className="font-medium">{appointment.title || "Untitled Appointment"}</div>
                      <div className="text-muted-foreground">
                        {new Date(appointment.scheduled_for).toLocaleString()} •
                        {appointment.client_name || "No client name"}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reassignType">Select a new appointment type:</Label>
              <Select
                value={reassignTargetTypeId}
                onValueChange={setReassignTargetTypeId}
              >
                <SelectTrigger id="reassignType" className="w-full">
                  <SelectValue placeholder="Select an appointment type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes
                    .filter(type => type.id !== typeToDelete?.id)
                    .map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.duration} min)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReassignDialogOpen(false);
                setAppointmentsUsingType([]);
                setReassignTargetTypeId("");
              }}
              disabled={isReassigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassignAndDelete}
              disabled={!reassignTargetTypeId || isReassigning}
            >
              {isReassigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reassigning...
                </>
              ) : (
                "Reassign and Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
