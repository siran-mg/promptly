"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
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
  const t = useTranslations();

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
            title: t('common.errorLabel'),
            description: t('settings.appointmentTypes.errors.loadFailed'),
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
          name: t('settings.appointmentTypes.defaultType.name'),
          description: t('settings.appointmentTypes.defaultType.description'),
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
        title: t('settings.appointmentTypes.defaultType.createdTitle'),
        description: t('settings.appointmentTypes.defaultType.createdDescription'),
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
    if (type.is_default && type.name === t('settings.appointmentTypes.defaultType.name')) {
      toast({
        title: t('settings.appointmentTypes.personalize.title'),
        description: t('settings.appointmentTypes.personalize.description'),
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
        title: t('settings.appointmentTypes.defaultUpdated.title'),
        description: t('settings.appointmentTypes.defaultUpdated.description', { name: type.name }),
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
          title: t('common.errorLabel'),
          description: t('settings.appointmentTypes.errors.deleteFailed'),
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
        title: t('settings.appointmentTypes.deleted.title'),
        description: t('settings.appointmentTypes.deleted.description'),
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
          title: t('common.error'),
          description: t('settings.appointmentTypes.errors.reassignFailed'),
          variant: "destructive",
        });
        return;
      }

      // Now delete the appointment type
      await deleteAppointmentType();

      // Show success message
      const targetType = appointmentTypes.find(t => t.id === reassignTargetTypeId);
      toast({
        title: t('settings.appointmentTypes.reassigned.title'),
        description: t('settings.appointmentTypes.reassigned.description', {
          count: appointmentsUsingType.length,
          name: targetType?.name || ''
        }),
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
    if (editingType?.is_default && formData.name === t('settings.appointmentTypes.defaultType.name')) {
      toast({
        title: t('settings.appointmentTypes.personalizationRequired.title'),
        description: t('settings.appointmentTypes.personalizationRequired.description'),
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
          title: t('settings.appointmentTypes.updated.title'),
          description: t('settings.appointmentTypes.updated.description'),
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
          title: t('settings.appointmentTypes.created.title'),
          description: t('settings.appointmentTypes.created.description'),
        });
      }

      // Close dialog and reset form
      setIsDialogOpen(false);
      setEditingType(null);
    } catch (err: any) {
      console.error("Error saving appointment type:", err);
      toast({
        title: t('common.saveFailed'),
        description: err?.message || t('settings.appointmentTypes.errors.saveFailed'),
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 sm:p-6 bg-indigo-50/50 rounded-lg border border-indigo-100">
        <div>
          <h3 className="text-xl font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            {t('settings.appointmentTypes.title')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.appointmentTypes.subtitle')}
          </p>
        </div>
        <PrimaryActionButton
          onClick={handleAddNew}
          icon={Plus}
          variant="indigo"
          className="w-full sm:w-auto"
        >
          {t('settings.appointmentTypes.addType')}
        </PrimaryActionButton>
      </div>

      {appointmentTypes.length === 0 ? (
        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
            <Calendar className="h-16 w-16 text-indigo-200 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-center">{t('settings.appointmentTypes.empty.title')}</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              {t('settings.appointmentTypes.empty.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <PrimaryActionButton
                onClick={handleAddNew}
                icon={Plus}
                variant="indigo"
                className="w-full sm:w-auto"
              >
                {t('settings.appointmentTypes.createCustomType')}
              </PrimaryActionButton>
              <Button
                variant="outline"
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) createDefaultAppointmentType(user.id);
                }}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-2 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                {t('settings.appointmentTypes.useStandardTemplate')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardHeader className="pb-4 px-4 sm:px-6">
            <CardTitle className="text-xl flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-600" />
              {t('settings.appointmentTypes.manage')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('settings.appointmentTypes.manageDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-indigo-50/50">
                  <TableRow>
                    <TableHead className="font-medium">{t('settings.appointmentTypes.table.name')}</TableHead>
                    <TableHead className="font-medium hidden sm:table-cell">{t('settings.appointmentTypes.table.duration')}</TableHead>
                    <TableHead className="font-medium hidden sm:table-cell">{t('settings.appointmentTypes.table.default')}</TableHead>
                    <TableHead className="text-right font-medium">{t('settings.appointmentTypes.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointmentTypes.map((type) => (
                    <TableRow
                      key={type.id}
                      className="cursor-pointer hover:bg-indigo-50/30 group relative transition-colors"
                      onClick={() => onSelectType ? onSelectType(type.id) : router.push(`/dashboard/appointment-types/${type.id}`)}
                      title={t('settings.appointmentTypes.clickToManage')}
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
                              <span className="ml-2 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:inline">
                                {t('settings.appointmentTypes.clickToManageShort')}
                              </span>
                            </div>
                            {type.description && (
                              <span className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[200px]">
                                {type.description}
                              </span>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 sm:hidden">
                              <Clock className="h-3 w-3 text-indigo-600" />
                              {t('settings.appointmentTypes.durationDisplay', { minutes: type.duration })}
                              {type.is_default && (
                                <span className="flex items-center text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-xs ml-1">
                                  <CheckCircle className="h-3 w-3 mr-0.5" />
                                  {t('settings.appointmentTypes.defaultType')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-indigo-600" />
                          {t('settings.appointmentTypes.durationDisplay', { minutes: type.duration })}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {type.is_default ? (
                          <span className="flex items-center text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('settings.appointmentTypes.defaultType')}
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
                            {t('settings.appointmentTypes.setAsDefault')}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1 sm:space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click event
                              router.push(`/dashboard/appointment-types/${type.id}/form`);
                            }}
                            className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                            title={t('settings.appointmentTypes.customizeFormSettings')}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">{t('settings.appointmentTypes.formSettings')}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click event
                              handleEdit(type);
                            }}
                            className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                            title={t('settings.appointmentTypes.editTypeTitle')}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">{t('common.editButton')}</span>
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
                            title={type.is_default ? t('settings.appointmentTypes.cannotDeleteDefault') : t('settings.appointmentTypes.deleteType')}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t('common.deleteButton')}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog for adding/editing appointment types */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {editingType ? (
                editingType.is_default ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-indigo-600" />
                    {t('settings.appointmentTypes.editDefaultType')}
                  </>
                ) : (
                  <>
                    <Edit className="h-5 w-5 text-indigo-600" />
                    {t('settings.appointmentTypes.editType')}
                  </>
                )
              ) : (
                <>
                  <Plus className="h-5 w-5 text-indigo-600" />
                  {t('settings.appointmentTypes.addType')}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-base">
              {editingType
                ? editingType.is_default
                  ? t('settings.appointmentTypes.defaultTypeDescription')
                  : t('settings.appointmentTypes.updateTypeDescription')
                : t('settings.appointmentTypes.createTypeDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-2">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">{t('settings.appointmentTypes.form.name')}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t('settings.appointmentTypes.form.namePlaceholder')}
                        required
                        className={`pl-10 border-indigo-200 focus-visible:ring-indigo-500 ${editingType?.is_default && formData.name === t('settings.appointmentTypes.defaultType.name') ? "border-destructive" : ""}`}
                      />
                    </div>
                    {editingType?.is_default && formData.name === t('settings.appointmentTypes.defaultType.name') && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {t('settings.appointmentTypes.personalizationRequired.message')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">{t('settings.appointmentTypes.form.description')}</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-indigo-600" />
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder={t('settings.appointmentTypes.form.descriptionPlaceholder')}
                        rows={3}
                        className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.appointmentTypes.form.descriptionHelp')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium">{t('settings.appointmentTypes.form.duration')}</Label>
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
                      {t('settings.appointmentTypes.form.durationHelp')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-sm font-medium">{t('settings.appointmentTypes.form.color')}</Label>
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: formData.color }}
                      ></div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 sm:gap-4 w-full">
                          <Input
                            id="color"
                            name="color"
                            type="color"
                            value={formData.color}
                            onChange={handleChange}
                            className="w-12 sm:w-16 h-8 sm:h-10 p-1 cursor-pointer"
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
                      {t('settings.appointmentTypes.form.colorHelp')}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 pt-3 p-3 sm:pt-4 sm:p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={formData.is_default}
                        onChange={(e) => handleCheckboxChange("is_default", e.target.checked)}
                        className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Label htmlFor="is_default" className="text-sm font-medium">
                        {t('settings.appointmentTypes.form.setAsDefault')}
                      </Label>
                    </div>
                    <div className="relative group">
                      <Info className="h-4 w-4 text-indigo-400 cursor-help" />
                      <div className="absolute left-0 -top-8 w-48 p-2 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {t('settings.appointmentTypes.form.defaultHelp')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview section */}
                <div className="border border-indigo-100 rounded-lg overflow-hidden">
                  <div className="bg-indigo-50 p-3 border-b border-indigo-100">
                    <h4 className="font-medium flex items-center gap-2 text-indigo-700">
                      <Eye className="h-4 w-4" />
                      {t('settings.appointmentTypes.preview.title')}
                    </h4>
                  </div>
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="border rounded-lg p-3 sm:p-4 bg-white shadow-sm">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                          style={{ backgroundColor: formData.color }}
                        ></div>
                        <div>
                          <div className="font-medium text-base sm:text-lg">{formData.name || t('settings.appointmentTypes.preview.defaultName')}</div>
                          {formData.description && (
                            <div className="text-sm text-muted-foreground">{formData.description}</div>
                          )}
                          <div className="text-xs text-muted-foreground flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {t('settings.appointmentTypes.preview.duration', { minutes: formData.duration || 60 })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {t('settings.appointmentTypes.preview.description')}
                    </div>

                    {formData.is_default && (
                      <div className="bg-indigo-50 text-indigo-700 p-3 rounded-md flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div>
                          <div className="font-medium">{t('settings.appointmentTypes.preview.defaultTitle')}</div>
                          <p className="text-sm">{t('settings.appointmentTypes.preview.defaultDescription')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 sm:pt-6 border-t mt-4 sm:mt-6 flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 w-full sm:w-auto"
              >
                {t('common.cancelButton')}
              </Button>
              <PrimaryActionButton
                type="submit"
                disabled={isSaving}
                isLoading={isSaving}
                loadingText={t('common.saving')}
                variant="indigo"
                className="w-full sm:w-auto"
              >
                {editingType ? t('settings.appointmentTypes.updateButton') : t('settings.appointmentTypes.createButton')}
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
        <DialogContent className="max-w-2xl w-[95vw] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('settings.appointmentTypes.reassign.title')}</DialogTitle>
            <DialogDescription>
              {t('settings.appointmentTypes.reassign.description', { count: appointmentsUsingType.length })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="bg-destructive/10 p-3 sm:p-4 rounded-md border border-destructive">
              <h4 className="font-medium text-destructive mb-2">{t('settings.appointmentTypes.reassign.appointmentsUsing')}</h4>
              <div className="max-h-36 sm:max-h-48 overflow-y-auto">
                <ul className="space-y-2">
                  {appointmentsUsingType.map(appointment => (
                    <li key={appointment.id} className="text-sm border-b pb-2">
                      <div className="font-medium">{appointment.title || t('settings.appointmentTypes.untitledAppointment')}</div>
                      <div className="text-muted-foreground text-xs sm:text-sm">
                        {new Date(appointment.scheduled_for).toLocaleString()} •
                        {appointment.client_name || t('settings.appointmentTypes.noClientName')}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reassignType">{t('settings.appointmentTypes.reassign.selectNew')}</Label>
              <Select
                value={reassignTargetTypeId}
                onValueChange={setReassignTargetTypeId}
              >
                <SelectTrigger id="reassignType" className="w-full">
                  <SelectValue placeholder={t('settings.appointmentTypes.reassign.selectPlaceholder')} />
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

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsReassignDialogOpen(false);
                setAppointmentsUsingType([]);
                setReassignTargetTypeId("");
              }}
              disabled={isReassigning}
              className="w-full sm:w-auto"
            >
              {t('common.cancelButton')}
            </Button>
            <Button
              onClick={handleReassignAndDelete}
              disabled={!reassignTargetTypeId || isReassigning}
              className="w-full sm:w-auto"
            >
              {isReassigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('settings.appointmentTypes.reassign.reassigning')}
                </>
              ) : (
                t('settings.appointmentTypes.reassign.confirmButton')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
