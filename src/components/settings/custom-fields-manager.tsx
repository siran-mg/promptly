"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
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
    { value: "text", label: "Text" },
    { value: "textarea", label: "Text Area" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "date", label: "Date" },
    { value: "time", label: "Time" },
    { value: "select", label: "Dropdown" },
    { value: "checkbox", label: "Checkbox" },
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
          title: "Cannot delete",
          description: (
            <div className="space-y-2">
              <p>This field is used by {count} appointment(s). Please remove the data first.</p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white text-destructive hover:bg-gray-100 border border-destructive/20 font-medium"
                  onClick={() => {
                    router.push(`/dashboard/appointments?field=${fieldToDelete.name}`);
                  }}
                >
                  View Appointments
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
          title: "Error",
          description: "Could not delete custom field. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setCustomFields(prev => prev.filter(f => f.id !== fieldToDelete.id));

      toast({
        title: "Custom field deleted",
        description: "The custom field has been deleted successfully.",
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
          title: "Custom field updated",
          description: "Your custom field has been updated successfully.",
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
          title: "Custom field created",
          description: "Your new custom field has been created successfully.",
        });
      }

      // Close dialog and reset form
      setIsDialogOpen(false);
      setEditingField(null);
    } catch (err: any) {
      console.error("Error saving custom field:", err);
      toast({
        title: "Save failed",
        description: err?.message || "Could not save custom field. Please try again.",
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
        <p className="text-sm text-indigo-700 font-medium">Loading custom fields...</p>
      </div>
    );
  }

  if (!appointmentType) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4 p-6 bg-red-50/30 rounded-lg border border-red-100">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <div className="text-center">
          <p className="font-medium text-red-700">Appointment type not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            The appointment type you're trying to manage may have been deleted or doesn't exist
          </p>
        </div>
        <Button
          variant="outline"
          className="mt-2 border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => router.push("/dashboard/settings?tab=appointment-types")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Appointment Types
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-sm text-indigo-600 font-medium">
            {customFields.length} {customFields.length === 1 ? 'field' : 'fields'} configured
          </p>
          <p className="text-sm text-muted-foreground">
            Add custom fields to collect additional information from clients
          </p>
        </div>
        <PrimaryActionButton
          onClick={handleAddNew}
          icon={Plus}
          variant="indigo"
        >
          Add New Field
        </PrimaryActionButton>
      </div>

      {customFields.length === 0 ? (
        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <FormInput className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">No custom fields yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Custom fields allow you to collect specific information from clients when they book this appointment type
            </p>
            <PrimaryActionButton
              onClick={handleAddNew}
              icon={Plus}
              variant="indigo"
            >
              Create Your First Custom Field
            </PrimaryActionButton>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardHeader className="pb-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <FormInput className="h-5 w-5 text-indigo-600" />
              Custom Fields
            </CardTitle>
            <CardDescription>
              Fields will appear in this order on the booking form
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
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
                    className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-indigo-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="h-6 w-6 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                        >
                          <ArrowUp className="h-4 w-4" />
                          <span className="sr-only">Move up</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === customFields.length - 1}
                          className="h-6 w-6 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                        >
                          <ArrowDown className="h-4 w-4" />
                          <span className="sr-only">Move down</span>
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <FieldIcon className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium">{field.label}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="capitalize">{field.type}</span>
                            {field.required && (
                              <span className="inline-flex items-center text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                                <Check className="h-3 w-3 mr-1" />
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(field)}
                        className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(field)}
                        className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {editingField ? (
                <>
                  <Pencil className="h-5 w-5 text-indigo-600" />
                  Edit Custom Field
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-indigo-600" />
                  Add Custom Field
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-base">
              {editingField
                ? "Update the details of this custom field"
                : "Create a new custom field to collect additional information from clients"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-2">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="label" className="text-sm font-medium">Field Label</Label>
                    <div className="relative">
                      <FormInput className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
                      <Input
                        id="label"
                        name="label"
                        value={formData.label}
                        onChange={handleChange}
                        placeholder="e.g., Medical History"
                        className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This is the label clients will see on the booking form
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium">Field Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleSelectChange("type", value)}
                    >
                      <SelectTrigger className="border-indigo-200 focus:ring-indigo-500">
                        <SelectValue placeholder="Select field type" />
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
                      Choose the type of input field that best suits your needs
                    </p>
                  </div>

                  {formData.type === "select" && (
                    <div className="space-y-2">
                      <Label htmlFor="options" className="text-sm font-medium">Options (one per line)</Label>
                      <div className="relative">
                        <List className="absolute left-3 top-3 h-4 w-4 text-indigo-600" />
                        <Textarea
                          id="options"
                          name="options"
                          value={formData.options}
                          onChange={handleChange}
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                          rows={4}
                          className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter each option on a new line
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="placeholder" className="text-sm font-medium">Placeholder Text (Optional)</Label>
                    <Input
                      id="placeholder"
                      name="placeholder"
                      value={formData.placeholder}
                      onChange={handleChange}
                      placeholder="e.g., Enter your medical history"
                      className="border-indigo-200 focus-visible:ring-indigo-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Text that appears in the field before the client enters a value
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default_value" className="text-sm font-medium">Default Value (Optional)</Label>
                    <Input
                      id="default_value"
                      name="default_value"
                      value={formData.default_value}
                      onChange={handleChange}
                      placeholder="e.g., None"
                      className="border-indigo-200 focus-visible:ring-indigo-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Pre-filled value that will appear in the field
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
                        Required field
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Clients must complete this field to submit the form
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview section */}
                <div className="border rounded-lg p-5 space-y-4 bg-indigo-50/30 border-indigo-100">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4 text-indigo-600" />
                    Field Preview
                  </h4>
                  <div className="border rounded-lg p-5 bg-white space-y-3 shadow-sm">
                    <Label htmlFor="preview-field" className="text-sm font-medium">
                      {formData.label || "Field Label"}
                      {formData.required && <span className="text-destructive ml-1">*</span>}
                    </Label>

                    {formData.type === "text" && (
                      <Input
                        id="preview-field"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                        className="border-indigo-200"
                      />
                    )}

                    {formData.type === "textarea" && (
                      <Textarea
                        id="preview-field"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                        rows={3}
                        className="border-indigo-200"
                      />
                    )}

                    {formData.type === "number" && (
                      <Input
                        id="preview-field"
                        type="number"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                        className="border-indigo-200"
                      />
                    )}

                    {formData.type === "email" && (
                      <Input
                        id="preview-field"
                        type="email"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                        className="border-indigo-200"
                      />
                    )}

                    {formData.type === "phone" && (
                      <Input
                        id="preview-field"
                        type="tel"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                        className="border-indigo-200"
                      />
                    )}

                    {formData.type === "select" && (
                      <Select defaultValue={formData.default_value || (formData.options ? formData.options.split("\n")[0]?.trim() : "preview-value")}>
                        <SelectTrigger className="border-indigo-200">
                          <SelectValue placeholder={formData.placeholder || "Select an option"} />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.options && formData.options.trim() !== "" ?
                            formData.options.split("\n").filter(opt => opt.trim() !== "").map((option, index) => (
                              <SelectItem key={index} value={option.trim() || `option-${index}`}>
                                {option.trim() || `Option ${index + 1}`}
                              </SelectItem>
                            ))
                          : [
                              <SelectItem key="default-1" value="preview-option-1">Option 1</SelectItem>,
                              <SelectItem key="default-2" value="preview-option-2">Option 2</SelectItem>,
                              <SelectItem key="default-3" value="preview-option-3">Option 3</SelectItem>
                            ]
                          }
                        </SelectContent>
                      </Select>
                    )}

                    {formData.type === "checkbox" && (
                      <div className="flex items-center space-x-2">
                        <Checkbox id="preview-field" className="border-indigo-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" />
                        <label htmlFor="preview-field" className="text-sm">
                          {formData.placeholder || "Yes"}
                        </label>
                      </div>
                    )}

                    {(formData.type === "date" || formData.type === "time") && (
                      <Input
                        id="preview-field"
                        placeholder={formData.placeholder || formData.type === "date" ? "Select a date" : "Select a time"}
                        value={formData.default_value || ""}
                        readOnly
                        className="border-indigo-200"
                      />
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-indigo-100">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-full bg-indigo-100">
                        <Check className="h-3 w-3 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Client Experience</p>
                        <p className="text-xs text-muted-foreground">
                          This is how your custom field will appear to clients in the booking form
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
                className="border-gray-200"
              >
                Cancel
              </Button>
              <PrimaryActionButton
                type="submit"
                disabled={isSaving}
                isLoading={isSaving}
                loadingText="Saving..."
                icon={editingField ? Pencil : Plus}
                variant="indigo"
              >
                {editingField ? "Update Field" : "Create Field"}
              </PrimaryActionButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for deletion */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Custom Field
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete this custom field?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {fieldToDelete && (
            <div className="my-6 p-4 border border-red-100 bg-red-50/50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700">
                    You're about to delete: <span className="font-bold">{fieldToDelete.label}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will permanently remove this field and any data collected through it. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-gray-200">Cancel</AlertDialogCancel>
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Field
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
