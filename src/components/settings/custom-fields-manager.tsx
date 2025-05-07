"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import {
  Loader2, Plus, Pencil, Trash2, GripVertical, ArrowUp, ArrowDown,
  FormInput, Check, AlertTriangle, FileText, Calendar, Clock, List,
  ToggleLeft, Mail, Phone, Hash, Eye,
  ArrowLeft
} from "lucide-react";
import { Database } from "@/types/supabase";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

type AppointmentType = Database["public"]["Tables"]["appointment_types"]["Row"];
type CustomField = Database["public"]["Tables"]["appointment_custom_fields"]["Row"];

interface CustomFieldsManagerProps {
  appointmentTypeId: string;
}

export function CustomFieldsManager({ appointmentTypeId }: CustomFieldsManagerProps) {
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations();

  const [isLoading, setIsLoading] = useState(true);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [appointmentType, setAppointmentType] = useState<AppointmentType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<CustomField | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    default_value: "",
    options: "",
  });

  // Field type options
  const fieldTypes = [
    { value: "text", label: t('settings.formSettingsSection.fieldTypes.text') },
    { value: "textarea", label: t('settings.formSettingsSection.fieldTypes.textarea') },
    { value: "number", label: t('settings.formSettingsSection.fieldTypes.number') },
    { value: "email", label: t('settings.formSettingsSection.fieldTypes.email') },
    { value: "phone", label: t('settings.formSettingsSection.fieldTypes.phone') },
    { value: "date", label: t('settings.formSettingsSection.fieldTypes.date') },
    { value: "time", label: t('settings.formSettingsSection.fieldTypes.time') },
    { value: "select", label: t('settings.formSettingsSection.fieldTypes.select') },
    { value: "checkbox", label: t('settings.formSettingsSection.fieldTypes.checkbox') },
  ];

  // Fetch appointment type and custom fields
  useEffect(() => {
    const fetchData = async () => {
      if (!appointmentTypeId) return;

      try {
        setIsLoading(true);

        // Fetch appointment type
        const { data: typeData, error: typeError } = await supabase
          .from("appointment_types")
          .select("*")
          .eq("id", appointmentTypeId)
          .single();

        if (typeError) {
          console.error("Error fetching appointment type:", typeError);
          return;
        }

        setAppointmentType(typeData);

        // Fetch custom fields
        const { data: fieldsData, error: fieldsError } = await supabase
          .from("appointment_custom_fields")
          .select("*")
          .eq("appointment_type_id", appointmentTypeId)
          .order("order_index");

        if (fieldsError) {
          console.error("Error fetching custom fields:", fieldsError);
          return;
        }

        setCustomFields(fieldsData || []);
      } catch (err) {
        console.error("Error in fetchData:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase, appointmentTypeId]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Open dialog to add a new custom field
  const handleAddNew = () => {
    setFormData({
      name: "",
      label: "",
      type: "text",
      required: false,
      placeholder: "",
      default_value: "",
      options: "",
    });
    setEditingField(null);
    setIsDialogOpen(true);
  };

  // Open dialog to edit an existing custom field
  const handleEdit = (field: CustomField) => {
    setFormData({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder || "",
      default_value: field.default_value || "",
      options: field.options ?
        (Array.isArray(field.options) ? field.options.join("\n") : JSON.stringify(field.options)) : "",
    });
    setEditingField(field);
    setIsDialogOpen(true);
  };

  // Open dialog to confirm deletion
  const handleDeleteClick = (field: CustomField) => {
    setFieldToDelete(field);
    setIsDeleteDialogOpen(true);
  };

  // Move a field up in the order
  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;

    try {
      const newFields = [...customFields];
      const field = newFields[index];
      const prevField = newFields[index - 1];

      // Swap order_index values
      const tempIndex = field.order_index;
      field.order_index = prevField.order_index;
      prevField.order_index = tempIndex;

      // Swap positions in array
      newFields[index] = prevField;
      newFields[index - 1] = field;

      setCustomFields(newFields);

      // Update in database
      const updates = [
        { id: field.id, order_index: field.order_index },
        { id: prevField.id, order_index: prevField.order_index }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("appointment_custom_fields")
          .update({ order_index: update.order_index })
          .eq("id", update.id);

        if (error) {
          console.error("Error updating field order:", error);
        }
      }
    } catch (err) {
      console.error("Error in handleMoveUp:", err);
    }
  };

  // Move a field down in the order
  const handleMoveDown = async (index: number) => {
    if (index >= customFields.length - 1) return;

    try {
      const newFields = [...customFields];
      const field = newFields[index];
      const nextField = newFields[index + 1];

      // Swap order_index values
      const tempIndex = field.order_index;
      field.order_index = nextField.order_index;
      nextField.order_index = tempIndex;

      // Swap positions in array
      newFields[index] = nextField;
      newFields[index + 1] = field;

      setCustomFields(newFields);

      // Update in database
      const updates = [
        { id: field.id, order_index: field.order_index },
        { id: nextField.id, order_index: nextField.order_index }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("appointment_custom_fields")
          .update({ order_index: update.order_index })
          .eq("id", update.id);

        if (error) {
          console.error("Error updating field order:", error);
        }
      }
    } catch (err) {
      console.error("Error in handleMoveDown:", err);
    }
  };

  // Delete a custom field
  const handleDelete = async () => {
    if (!fieldToDelete) return;

    try {
      // Check if this field is used by any appointments
      const { count, error: countError } = await supabase
        .from("appointment_field_values")
        .select("*", { count: "exact", head: true })
        .eq("field_id", fieldToDelete.id);

      if (countError) {
        console.error("Error checking field values:", countError);
        return;
      }

      if (count && count > 0) {
        toast({
          title: t('settings.formSettingsSection.fieldErrors.cannotDelete'),
          description: (
            <div className="space-y-2">
              <p>{t('settings.formSettingsSection.fieldErrors.fieldInUse', { count })}</p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white text-destructive hover:bg-gray-100 border border-destructive/20 font-medium"
                  onClick={() => {
                    router.push(`/dashboard/appointments?field=${fieldToDelete.name}`);
                  }}
                >
                  {t('settings.formSettingsSection.viewAppointments')}
                </Button>
              </div>
            </div>
          ),
          variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
        return;
      }

      // Delete the custom field
      const { error } = await supabase
        .from("appointment_custom_fields")
        .delete()
        .eq("id", fieldToDelete.id);

      if (error) {
        console.error("Error deleting custom field:", error);
        toast({
          title: t('common.error'),
          description: t('settings.formSettingsSection.fieldErrors.deleteError'),
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setCustomFields(prev => prev.filter(f => f.id !== fieldToDelete.id));

      toast({
        title: t('settings.formSettingsSection.fieldDeleted'),
        description: t('settings.formSettingsSection.fieldDeletedDescription'),
      });
    } catch (err) {
      console.error("Error in handleDelete:", err);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Save a new or edited custom field
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Parse options for select fields
      let parsedOptions = null;
      if (formData.type === "select" && formData.options) {
        parsedOptions = formData.options
          .split("\n")
          .map(option => option.trim())
          .filter(option => option.length > 0);
      }

      const customFieldData = {
        name: formData.name.replace(/\s+/g, '_').toLowerCase(),
        label: formData.label,
        type: formData.type,
        required: formData.required,
        placeholder: formData.placeholder || null,
        default_value: formData.default_value || null,
        options: parsedOptions,
      };

      if (editingField) {
        // Update existing custom field
        const { data, error } = await supabase
          .from("appointment_custom_fields")
          .update(customFieldData)
          .eq("id", editingField.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Update local state
        setCustomFields(prev =>
          prev.map(field => field.id === editingField.id ? data : field)
        );

        toast({
          title: t('settings.formSettingsSection.fieldUpdated'),
          description: t('settings.formSettingsSection.fieldUpdatedDescription'),
        });
      } else {
        // Create new custom field
        const { data, error } = await supabase
          .from("appointment_custom_fields")
          .insert({
            ...customFieldData,
            user_id: user.id,
            appointment_type_id: appointmentTypeId,
            order_index: customFields.length,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Update local state
        setCustomFields(prev => [...prev, data]);

        toast({
          title: t('settings.formSettingsSection.fieldCreated'),
          description: t('settings.formSettingsSection.fieldCreatedDescription'),
        });
      }

      // Close dialog and reset form
      setIsDialogOpen(false);
      setEditingField(null);
    } catch (err: any) {
      console.error("Error saving custom field:", err);
      toast({
        title: t('settings.formSettingsSection.fieldErrors.saveFailed'),
        description: err?.message || t('settings.formSettingsSection.fieldErrors.saveError'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4 p-6 bg-indigo-50/30 rounded-lg border border-indigo-100">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-sm text-indigo-700 font-medium">{t('settings.formSettingsSection.loading')}</p>
      </div>
    );
  }

  if (!appointmentType) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4 p-6 bg-red-50/30 rounded-lg border border-red-100">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <div className="text-center">
          <p className="font-medium text-red-700">{t('settings.formSettingsSection.fieldErrors.typeNotFound')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.formSettingsSection.fieldErrors.typeNotFoundDescription')}
          </p>
        </div>
        <Button
          variant="outline"
          className="mt-2 border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => router.push("/dashboard/appointment-types")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('settings.appointmentTypes.backToTypes')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <p className="text-sm text-indigo-600 font-medium">
            {t('settings.formSettingsSection.fieldsConfigured', {
              count: customFields.length,
              fields: customFields.length === 1
                ? t('settings.formSettingsSection.fieldSingular')
                : t('settings.formSettingsSection.fieldPlural')
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('settings.formSettingsSection.fieldsDescription')}
          </p>
        </div>
        <PrimaryActionButton
          onClick={handleAddNew}
          icon={Plus}
          variant="indigo"
          className="w-full sm:w-auto mt-2 sm:mt-0"
        >
          {t('settings.formSettingsSection.addNewField')}
        </PrimaryActionButton>
      </div>

      {customFields.length === 0 ? (
        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <FormInput className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t('settings.formSettingsSection.customFields.noFieldsYet')}</h3>
            <p className="text-muted-foreground mb-6 max-w-md text-sm sm:text-base">
              {t('settings.formSettingsSection.customFields.noFieldsDescription')}
            </p>
            <PrimaryActionButton
              onClick={handleAddNew}
              icon={Plus}
              variant="indigo"
              className="w-full sm:w-auto"
            >
              {t('settings.formSettingsSection.customFields.createFirstField')}
            </PrimaryActionButton>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardHeader className="pb-0 px-4 sm:px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <FormInput className="h-5 w-5 text-indigo-600" />
              {t('settings.formSettingsSection.customFields.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.formSettingsSection.customFields.orderDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3">
              {customFields.map((field, index) => {
                // Get the appropriate icon based on field type
                let FieldIcon = FormInput;
                switch(field.type) {
                  case 'text': FieldIcon = FormInput; break;
                  case 'textarea': FieldIcon = FileText; break;
                  case 'number': FieldIcon = Hash; break;
                  case 'email': FieldIcon = Mail; break;
                  case 'phone': FieldIcon = Phone; break;
                  case 'date': FieldIcon = Calendar; break;
                  case 'time': FieldIcon = Clock; break;
                  case 'select': FieldIcon = List; break;
                  case 'checkbox': FieldIcon = ToggleLeft; break;
                  default: FieldIcon = FormInput;
                }

                return (
                  <div
                    key={field.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg bg-white hover:bg-indigo-50/30 transition-colors gap-3 sm:gap-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-row sm:flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="h-6 w-6 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                        >
                          <ArrowUp className="h-4 w-4" />
                          <span className="sr-only">{t('settings.formSettingsSection.customFields.moveUp')}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === customFields.length - 1}
                          className="h-6 w-6 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                        >
                          <ArrowDown className="h-4 w-4" />
                          <span className="sr-only">{t('settings.formSettingsSection.customFields.moveDown')}</span>
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <FieldIcon className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium">{field.label}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                            <span className="capitalize">{field.type}</span>
                            {field.required && (
                              <span className="inline-flex items-center text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                                <Check className="h-3 w-3 mr-1" />
                                {t('settings.formSettingsSection.customFields.required')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(field)}
                        className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex-1 sm:flex-initial"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        {t('common.editButton')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(field)}
                        className="h-8 border-red-200 text-red-600 hover:bg-red-50 flex-1 sm:flex-initial"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('common.deleteButton')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog for adding/editing custom fields */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              {editingField ? (
                <>
                  <Pencil className="h-5 w-5 text-indigo-600" />
                  {t('settings.formSettingsSection.customFields.editField')}
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-indigo-600" />
                  {t('settings.formSettingsSection.customFields.addField')}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {editingField
                ? t('settings.formSettingsSection.customFields.updateDescription')
                : t('settings.formSettingsSection.customFields.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 sm:space-y-6 py-2">
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                <div className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="label" className="text-sm font-medium">{t('settings.formSettingsSection.customFields.fieldLabel')}</Label>
                    <div className="relative">
                      <FormInput className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
                      <Input
                        id="label"
                        name="label"
                        value={formData.label}
                        onChange={handleChange}
                        placeholder={t('settings.formSettingsSection.customFields.fieldLabelPlaceholder')}
                        className="pl-10 border-indigo-200 focus-visible:ring-indigo-500 h-9 sm:h-10 text-sm"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.formSettingsSection.customFields.fieldLabelHelp')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium">{t('settings.formSettingsSection.fieldType')}</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleSelectChange("type", value)}
                    >
                      <SelectTrigger className="border-indigo-200 focus:ring-indigo-500 h-9 sm:h-10 text-sm">
                        <SelectValue placeholder={t('settings.formSettingsSection.customFields.fieldTypePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((type) => {
                          // Get the appropriate icon based on field type
                          let TypeIcon = FormInput;
                          switch(type.value) {
                            case 'text': TypeIcon = FormInput; break;
                            case 'textarea': TypeIcon = FileText; break;
                            case 'number': TypeIcon = Hash; break;
                            case 'email': TypeIcon = Mail; break;
                            case 'phone': TypeIcon = Phone; break;
                            case 'date': TypeIcon = Calendar; break;
                            case 'time': TypeIcon = Clock; break;
                            case 'select': TypeIcon = List; break;
                            case 'checkbox': TypeIcon = ToggleLeft; break;
                            default: TypeIcon = FormInput;
                          }

                          return (
                            <SelectItem key={type.value} value={type.value} className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <TypeIcon className="h-4 w-4 text-indigo-600" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.formSettingsSection.customFields.fieldTypeHelp')}
                    </p>
                  </div>

                  {formData.type === "select" && (
                    <div className="space-y-2">
                      <Label htmlFor="options" className="text-sm font-medium">{t('settings.formSettingsSection.customFields.optionsLabel')}</Label>
                      <div className="relative">
                        <List className="absolute left-3 top-3 h-4 w-4 text-indigo-600" />
                        <Textarea
                          id="options"
                          name="options"
                          value={formData.options}
                          onChange={handleChange}
                          placeholder={t('settings.formSettingsSection.customFields.optionsPlaceholder')}
                          rows={4}
                          className="pl-10 border-indigo-200 focus-visible:ring-indigo-500 text-sm"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('settings.formSettingsSection.customFields.optionsHelp')}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="placeholder" className="text-sm font-medium">{t('settings.formSettingsSection.customFields.placeholderLabel')}</Label>
                    <Input
                      id="placeholder"
                      name="placeholder"
                      value={formData.placeholder}
                      onChange={handleChange}
                      placeholder={t('settings.formSettingsSection.customFields.placeholderTextPlaceholder')}
                      className="border-indigo-200 focus-visible:ring-indigo-500 h-9 sm:h-10 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('settings.formSettingsSection.customFields.placeholderHelp')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default_value" className="text-sm font-medium">{t('settings.formSettingsSection.customFields.defaultValueLabel')}</Label>
                    <Input
                      id="default_value"
                      name="default_value"
                      value={formData.default_value}
                      onChange={handleChange}
                      placeholder={t('settings.formSettingsSection.customFields.defaultValuePlaceholder')}
                      className="border-indigo-200 focus-visible:ring-indigo-500 h-9 sm:h-10 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('settings.formSettingsSection.customFields.defaultValueHelp')}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 pt-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    <Switch
                      id="required"
                      checked={formData.required}
                      onCheckedChange={(checked) => handleSwitchChange("required", checked)}
                      className="data-[state=checked]:bg-indigo-600"
                    />
                    <div>
                      <Label htmlFor="required" className="text-sm font-medium">
                        {t('settings.formSettingsSection.customFields.requiredField')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('settings.formSettingsSection.customFields.requiredFieldHelp')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview section */}
                <div className="border rounded-lg p-3 sm:p-5 space-y-3 sm:space-y-4 bg-indigo-50/30 border-indigo-100">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4 text-indigo-600" />
                    {t('settings.formSettingsSection.customFields.fieldPreview')}
                  </h4>
                  <div className="border rounded-lg p-3 sm:p-5 bg-white space-y-3 shadow-sm">
                    <Label htmlFor="preview-field" className="text-sm font-medium">
                      {formData.label || t('settings.formSettingsSection.customFields.defaultLabel')}
                      {formData.required && <span className="text-destructive ml-1">*</span>}
                    </Label>

                    {formData.type === "text" && (
                      <Input
                        id="preview-field"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                        className="border-indigo-200 h-9 sm:h-10 text-sm"
                      />
                    )}

                    {formData.type === "textarea" && (
                      <Textarea
                        id="preview-field"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                        rows={3}
                        className="border-indigo-200 text-sm"
                      />
                    )}

                    {formData.type === "number" && (
                      <Input
                        id="preview-field"
                        type="number"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                        className="border-indigo-200 h-9 sm:h-10 text-sm"
                      />
                    )}

                    {formData.type === "email" && (
                      <Input
                        id="preview-field"
                        type="email"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                        className="border-indigo-200 h-9 sm:h-10 text-sm"
                      />
                    )}

                    {formData.type === "phone" && (
                      <Input
                        id="preview-field"
                        type="tel"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                        className="border-indigo-200 h-9 sm:h-10 text-sm"
                      />
                    )}

                    {formData.type === "select" && (
                      <Select defaultValue={formData.default_value || (formData.options ? formData.options.split("\n")[0]?.trim() : "preview-value")}>
                        <SelectTrigger className="border-indigo-200 h-9 sm:h-10 text-sm">
                          <SelectValue placeholder={formData.placeholder || t('settings.formSettingsSection.customFields.selectOptionPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.options && formData.options.trim() !== "" ?
                            formData.options.split("\n").filter(opt => opt.trim() !== "").map((option, index) => (
                              <SelectItem key={index} value={option.trim() || `option-${index}`}>
                                {option.trim() || `${t('settings.formSettingsSection.customFields.option')} ${index + 1}`}
                              </SelectItem>
                            ))
                          : [
                              <SelectItem key="default-1" value="preview-option-1">{t('settings.formSettingsSection.customFields.option')} 1</SelectItem>,
                              <SelectItem key="default-2" value="preview-option-2">{t('settings.formSettingsSection.customFields.option')} 2</SelectItem>,
                              <SelectItem key="default-3" value="preview-option-3">{t('settings.formSettingsSection.customFields.option')} 3</SelectItem>
                            ]
                          }
                        </SelectContent>
                      </Select>
                    )}

                    {formData.type === "checkbox" && (
                      <div className="flex items-center space-x-2">
                        <Checkbox id="preview-field" className="border-indigo-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" />
                        <label htmlFor="preview-field" className="text-sm">
                          {formData.placeholder || t('settings.formSettingsSection.customFields.defaultCheckboxLabel')}
                        </label>
                      </div>
                    )}

                    {(formData.type === "date" || formData.type === "time") && (
                      <Input
                        id="preview-field"
                        placeholder={formData.placeholder || (formData.type === "date" ? t('settings.formSettingsSection.customFields.selectDatePlaceholder') : t('settings.formSettingsSection.customFields.selectTimePlaceholder'))}
                        value={formData.default_value || ""}
                        readOnly
                        className="border-indigo-200 h-9 sm:h-10 text-sm"
                      />
                    )}
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-indigo-100">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-full bg-indigo-100">
                        <Check className="h-3 w-3 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{t('settings.formSettingsSection.customFields.clientExperience')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.formSettingsSection.customFields.clientExperienceDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 gap-2 flex-col sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
                className="border-gray-200 w-full sm:w-auto"
              >
                {t('common.cancelButton')}
              </Button>
              <PrimaryActionButton
                type="submit"
                disabled={isSaving}
                isLoading={isSaving}
                loadingText={t('common.saving')}
                icon={editingField ? Pencil : Plus}
                variant="indigo"
                className="w-full sm:w-auto"
              >
                {editingField ? t('settings.formSettingsSection.customFields.updateField') : t('settings.formSettingsSection.customFields.createField')}
              </PrimaryActionButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for deletion */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Trash2 className="h-5 w-5 text-red-600" />
              {t('settings.formSettingsSection.customFields.deleteField')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              {t('settings.formSettingsSection.customFields.deleteConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {fieldToDelete && (
            <div className="my-4 sm:my-6 p-3 sm:p-4 border border-red-100 bg-red-50/50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700 text-sm sm:text-base">
                    {t('settings.formSettingsSection.customFields.deleteWarning')}: <span className="font-bold">{fieldToDelete.label}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {t('settings.formSettingsSection.customFields.deleteWarningDescription')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter className="gap-2 flex-col sm:flex-row mt-4">
            <AlertDialogCancel className="border-gray-200 w-full sm:w-auto">{t('common.cancelButton')}</AlertDialogCancel>
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="gap-2 w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4" />
              {t('settings.formSettingsSection.customFields.deleteButton')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
