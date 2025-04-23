"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Pencil, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
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
          description: `This field is used by ${count} appointment(s). Please remove the data first.`,
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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!appointmentType) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Appointment type not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Custom Fields for {appointmentType.name}</h3>
          <p className="text-sm text-muted-foreground">
            Add custom fields to collect additional information for this appointment type.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      {customFields.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <p className="text-muted-foreground mb-4">No custom fields found for this appointment type.</p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Custom Field
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {customFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3 border rounded-md bg-background"
                >
                  <div className="flex items-center">
                    <div className="flex flex-col items-center mr-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Move up</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === customFields.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">Move down</span>
                      </Button>
                    </div>
                    <div>
                      <div className="font-medium">{field.label}</div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <span className="capitalize">{field.type}</span>
                        {field.required && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(field)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(field)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog for adding/editing custom fields */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField ? "Edit Custom Field" : "Add Custom Field"}
            </DialogTitle>
            <DialogDescription>
              {editingField
                ? "Update the details of this custom field."
                : "Create a new custom field to collect additional information."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-2">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="label">Field Label</Label>
                    <Input
                      id="label"
                      name="label"
                      value={formData.label}
                      onChange={handleChange}
                      placeholder="e.g., Medical History"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Field Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleSelectChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === "select" && (
                    <div className="space-y-2">
                      <Label htmlFor="options">Options (one per line)</Label>
                      <Textarea
                        id="options"
                        name="options"
                        value={formData.options}
                        onChange={handleChange}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        rows={4}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="placeholder">Placeholder (Optional)</Label>
                    <Input
                      id="placeholder"
                      name="placeholder"
                      value={formData.placeholder}
                      onChange={handleChange}
                      placeholder="e.g., Enter your medical history"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default_value">Default Value (Optional)</Label>
                    <Input
                      id="default_value"
                      name="default_value"
                      value={formData.default_value}
                      onChange={handleChange}
                      placeholder="e.g., None"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="required"
                      checked={formData.required}
                      onCheckedChange={(checked) => handleSwitchChange("required", checked)}
                    />
                    <Label htmlFor="required" className="text-sm font-medium">
                      Required field
                    </Label>
                  </div>
                </div>

                {/* Preview section */}
                <div className="border rounded-md p-4 space-y-4">
                  <h4 className="text-sm font-medium">Field Preview</h4>
                  <div className="border rounded-md p-4 bg-card space-y-2">
                    <Label htmlFor="preview-field">
                      {formData.label || "Field Label"}
                      {formData.required && <span className="text-destructive ml-1">*</span>}
                    </Label>

                    {formData.type === "text" && (
                      <Input
                        id="preview-field"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                      />
                    )}

                    {formData.type === "textarea" && (
                      <Textarea
                        id="preview-field"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                        rows={3}
                      />
                    )}

                    {formData.type === "number" && (
                      <Input
                        id="preview-field"
                        type="number"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                      />
                    )}

                    {formData.type === "email" && (
                      <Input
                        id="preview-field"
                        type="email"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                      />
                    )}

                    {formData.type === "phone" && (
                      <Input
                        id="preview-field"
                        type="tel"
                        placeholder={formData.placeholder || ""}
                        value={formData.default_value || ""}
                        readOnly
                      />
                    )}

                    {formData.type === "select" && (
                      <Select defaultValue={formData.default_value || (formData.options ? formData.options.split("\n")[0]?.trim() : "preview-value")}>
                        <SelectTrigger>
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
                        <Checkbox id="preview-field" />
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
                      />
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground mt-2">
                    This is how your custom field will appear to clients in the booking form.
                  </div>
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
                ) : editingField ? (
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
              This will permanently delete the custom field
              {fieldToDelete && <strong> "{fieldToDelete.label}"</strong>}.
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
