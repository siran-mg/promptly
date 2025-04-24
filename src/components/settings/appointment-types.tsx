"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, Plus, Pencil, Trash2, Check, Star, Clock,
  Calendar, Settings, FileText, Palette, CheckCircle, AlertCircle, Info,
  Edit, Eye
} from "lucide-react";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-6 bg-indigo-50/50 rounded-lg border border-indigo-100">
        <div>
          <h3 className="text-xl font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Appointment Types
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage different types of appointments with custom durations and fields
          </p>
        </div>
        <PrimaryActionButton
          onClick={handleAddNew}
          icon={Plus}
          variant="indigo"
        >
          Add Appointment Type
        </PrimaryActionButton>
      </div>

      {appointmentTypes.length === 0 ? (
        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <Calendar className="h-16 w-16 text-indigo-200 mb-4" />
            <h3 className="text-lg font-medium mb-2">No appointment types yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Appointment types help you organize your schedule and collect the right information from clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <PrimaryActionButton
                onClick={handleAddNew}
                icon={Plus}
                variant="indigo"
              >
                Create Custom Type
              </PrimaryActionButton>
              <Button
                variant="outline"
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) createDefaultAppointmentType(user.id);
                }}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-2"
              >
                <Plus className="h-4 w-4" />
                Use Standard Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-600" />
              Manage Your Appointment Types
            </CardTitle>
            <CardDescription className="text-base">
              Click on a type to manage its custom fields and form settings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-indigo-50/50">
                <TableRow>
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Duration</TableHead>
                  <TableHead className="font-medium">Default</TableHead>
                  <TableHead className="text-right font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointmentTypes.map((type) => (
                  <TableRow
                    key={type.id}
                    className="cursor-pointer hover:bg-indigo-50/30 group relative transition-colors"
                    onClick={() => onSelectType ? onSelectType(type.id) : router.push(`/dashboard/settings?tab=appointment-types&appointmentTypeId=${type.id}`)}
                    title="Click to manage custom fields and form settings"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border border-indigo-100 flex-shrink-0"
                          style={{ backgroundColor: type.color || '#6366f1' }}
                        ></div>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span>{type.name}</span>
                            <span className="ml-2 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              (Click to manage)
                            </span>
                          </div>
                          {type.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {type.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        {type.duration} minutes
                      </div>
                    </TableCell>
                    <TableCell>
                      {type.is_default ? (
                        <span className="flex items-center text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Default Type
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click event
                            handleSetDefault(type);
                          }}
                          className="h-7 text-xs hover:bg-indigo-50 hover:text-indigo-700"
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
                          className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                          title="Customize form settings for this appointment type"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Form Settings</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click event
                            handleEdit(type);
                          }}
                          className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
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
                          className={`h-8 w-8 p-0 ${type.is_default
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {editingType ? (
                editingType.is_default ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-indigo-600" />
                    Edit Default Appointment Type
                  </>
                ) : (
                  <>
                    <Edit className="h-5 w-5 text-indigo-600" />
                    Edit Appointment Type
                  </>
                )
              ) : (
                <>
                  <Plus className="h-5 w-5 text-indigo-600" />
                  Add Appointment Type
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-base">
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
                    <Label htmlFor="name" className="text-sm font-medium">Appointment Type Name</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Initial Consultation"
                        required
                        className={`pl-10 border-indigo-200 focus-visible:ring-indigo-500 ${editingType?.is_default && formData.name === "Standard Appointment" ? "border-destructive" : ""}`}
                      />
                    </div>
                    {editingType?.is_default && formData.name === "Standard Appointment" && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Please personalize the default appointment type name for your business.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-indigo-600" />
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe what this appointment type is for"
                        rows={3}
                        className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This description will be visible to clients when booking appointments
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
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
                        className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      How long this appointment type typically lasts
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-sm font-medium">Color</Label>
                    <div className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                      <div
                        className="w-12 h-12 rounded-full border-4 border-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: formData.color }}
                      ></div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4 w-full">
                          <Input
                            id="color"
                            name="color"
                            type="color"
                            value={formData.color}
                            onChange={handleChange}
                            className="w-16 h-10 p-1 cursor-pointer"
                          />
                          <div className="relative flex-1">
                            <Palette className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
                            <Input
                              id="color_text"
                              name="color"
                              type="text"
                              value={formData.color}
                              onChange={handleChange}
                              placeholder="#6366f1"
                              className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This color will be used to identify this appointment type throughout the application
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 pt-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={formData.is_default}
                        onChange={(e) => handleCheckboxChange("is_default", e.target.checked)}
                        className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Label htmlFor="is_default" className="text-sm font-medium">
                        Set as default appointment type
                      </Label>
                    </div>
                    <div className="relative group">
                      <Info className="h-4 w-4 text-indigo-400 cursor-help" />
                      <div className="absolute left-0 -top-8 w-48 p-2 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        This type will be pre-selected when clients book appointments
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview section */}
                <div className="border border-indigo-100 rounded-lg overflow-hidden">
                  <div className="bg-indigo-50 p-3 border-b border-indigo-100">
                    <h4 className="font-medium flex items-center gap-2 text-indigo-700">
                      <Eye className="h-4 w-4" />
                      Preview
                    </h4>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                          style={{ backgroundColor: formData.color }}
                        ></div>
                        <div>
                          <div className="font-medium text-lg">{formData.name || "Appointment Type"}</div>
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

                    <div className="text-sm text-muted-foreground">
                      This is how your appointment type will appear to clients in the booking form
                    </div>

                    {formData.is_default && (
                      <div className="bg-indigo-50 text-indigo-700 p-3 rounded-md flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div>
                          <div className="font-medium">Default Appointment Type</div>
                          <p className="text-sm">This type will be pre-selected when clients book appointments</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-6 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                Cancel
              </Button>
              <PrimaryActionButton
                type="submit"
                disabled={isSaving}
                isLoading={isSaving}
                loadingText="Saving..."
                variant="indigo"
              >
                {editingType ? "Update Appointment Type" : "Create Appointment Type"}
              </PrimaryActionButton>
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
