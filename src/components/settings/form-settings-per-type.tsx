"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/types/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormPreview } from "@/components/settings/form-preview";
import { Switch } from "@/components/ui/switch";

type AppointmentType = Database["public"]["Tables"]["appointment_types"]["Row"];

interface FormSettingsPerTypeProps {
  appointmentTypeId: string;
  appointmentType?: AppointmentType;
}

interface FormSettingsPerType {
  id: string;
  user_id: string;
  appointment_type_id: string;
  form_title: string | null;
  form_description: string | null;
  logo_url: string | null;
  accent_color: string | null;
}

export function FormSettingsPerType({ appointmentTypeId, appointmentType }: FormSettingsPerTypeProps) {
  const { toast } = useToast();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [useGlobalSettings, setUseGlobalSettings] = useState(true);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    form_title: "",
    form_description: "",
    logo_url: "",
    accent_color: "#6366f1",
  });

  // Fetch form settings for this appointment type
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        // First, fetch global form settings
        const { data: globalData, error: globalError } = await supabase
          .from("form_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (globalError && globalError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error("Error fetching global form settings:", globalError);
          toast({
            title: "Error",
            description: "Could not load global form settings. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setGlobalSettings(globalData || {
          form_title: "Book an Appointment",
          form_description: "Fill out the form below to schedule your appointment.",
          logo_url: "",
          accent_color: "#6366f1",
        });

        // Then, fetch type-specific form settings
        const { data: typeData, error: typeError } = await supabase
          .from("form_settings_per_type")
          .select("*")
          .eq("user_id", user.id)
          .eq("appointment_type_id", appointmentTypeId)
          .single();

        if (typeError && typeError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error("Error fetching type-specific form settings:", typeError);
          toast({
            title: "Error",
            description: "Could not load form settings for this appointment type. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // If we have type-specific settings, use them
        if (typeData) {
          setUseGlobalSettings(false);
          setFormData({
            form_title: typeData.form_title || appointmentType?.name || "Book an Appointment",
            form_description: typeData.form_description || "Fill out the form below to schedule your appointment.",
            logo_url: typeData.logo_url || "",
            accent_color: typeData.accent_color || appointmentType?.color || "#6366f1",
          });
        } else {
          // Otherwise, use global settings as a starting point
          setUseGlobalSettings(true);
          setFormData({
            form_title: globalData?.form_title || "Book an Appointment",
            form_description: globalData?.form_description || "Fill out the form below to schedule your appointment.",
            logo_url: globalData?.logo_url || "",
            accent_color: appointmentType?.color || globalData?.accent_color || "#6366f1",
          });
        }
      } catch (err) {
        console.error("Error in fetchSettings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (appointmentTypeId) {
      fetchSettings();
    }
  }, [supabase, appointmentTypeId, appointmentType, toast]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Use the logos bucket for storing form logos
  const STORAGE_BUCKET_NAME = "logos";

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileType = file.type;
    if (!fileType.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please log in again to upload a logo.",
          variant: "destructive",
        });
        return;
      }

      // If there's an existing logo, try to delete it
      if (formData.logo_url) {
        try {
          // Extract the file path from the URL
          const url = new URL(formData.logo_url);
          const pathParts = url.pathname.split('/');
          const filePath = pathParts[pathParts.length - 1];

          if (filePath && filePath.startsWith('logo-')) {
            const { error: removeError } = await supabase.storage
              .from(STORAGE_BUCKET_NAME)
              .remove([filePath]);

            if (removeError) {
              console.warn("Could not remove old logo, but continuing:", removeError);
            } else {
              console.log("Deleted old logo:", filePath);
            }
          }
        } catch (deleteErr) {
          // Just log the error but continue with the upload
          console.error("Error deleting old logo:", deleteErr);
        }
      }

      // Create a safe filename - remove special characters and spaces
      const fileExt = file.name.split('.').pop();
      const safeFileName = `logo-${user.id}-${appointmentTypeId}-${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .upload(safeFileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .getPublicUrl(data.path);

      // Update form data with the public URL
      setFormData((prev) => ({ ...prev, logo_url: publicUrl }));

      toast({
        title: "Logo uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    } catch (err: any) {
      console.error("Error uploading logo:", err);
      toast({
        title: "Upload failed",
        description: err?.message || "Could not upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    console.log("Submitting form settings:", {
      useGlobalSettings,
      appointmentTypeId,
      formData
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (useGlobalSettings) {
        // If using global settings, delete any type-specific settings
        const { error } = await supabase
          .from("form_settings_per_type")
          .delete()
          .eq("user_id", user.id)
          .eq("appointment_type_id", appointmentTypeId);

        if (error) {
          throw error;
        }

        toast({
          title: "Settings saved",
          description: "This appointment type will now use global form settings.",
        });
      } else {
        // First check if a record already exists
        const { data: existingRecord, error: checkError } = await supabase
          .from("form_settings_per_type")
          .select("id")
          .eq("user_id", user.id)
          .eq("appointment_type_id", appointmentTypeId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error("Error checking existing record:", checkError);
          // Continue anyway, we'll try the upsert
        }

        // Prepare the data to save
        const formSettingsData = {
          user_id: user.id,
          appointment_type_id: appointmentTypeId,
          form_title: formData.form_title,
          form_description: formData.form_description,
          logo_url: formData.logo_url,
          accent_color: formData.accent_color,
          updated_at: new Date().toISOString(),
        };

        let error;

        if (existingRecord) {
          // If record exists, update it
          const { error: updateError } = await supabase
            .from("form_settings_per_type")
            .update(formSettingsData)
            .eq("id", existingRecord.id);

          error = updateError;
        } else {
          // Otherwise insert a new record
          const { error: insertError } = await supabase
            .from("form_settings_per_type")
            .insert(formSettingsData);

          error = insertError;
        }

        if (error) {
          throw error;
        }

        toast({
          title: "Settings saved",
          description: "Your form settings for this appointment type have been saved successfully.",
        });
      }
    } catch (err: any) {
      console.error("Error saving form settings:", err);

      // Provide more specific error messages
      let errorMessage = "Could not save form settings. Please try again.";

      // Check for specific error codes or messages
      if (err?.code === "23505") {
        errorMessage = "A record with this appointment type already exists. Try refreshing the page.";
      } else if (err?.message) {
        errorMessage = err.message;
      }

      toast({
        title: "Save failed",
        description: errorMessage,
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
    <Tabs defaultValue="customize">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="customize">Customize Form</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>

      <TabsContent value="customize" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Customization for {appointmentType?.name}</CardTitle>
            <CardDescription>
              Customize how your appointment booking form appears to clients for this specific appointment type.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-global-settings"
                  checked={useGlobalSettings}
                  onCheckedChange={setUseGlobalSettings}
                />
                <Label htmlFor="use-global-settings">
                  Use global form settings
                </Label>
              </div>

              {!useGlobalSettings && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="form_title">Form Title</Label>
                    <Input
                      id="form_title"
                      name="form_title"
                      value={formData.form_title}
                      onChange={handleChange}
                      placeholder="Book an Appointment"
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      This title appears at the top of your booking form.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="form_description">Form Description</Label>
                    <Textarea
                      id="form_description"
                      name="form_description"
                      value={formData.form_description}
                      onChange={handleChange}
                      placeholder="Fill out the form below to schedule your appointment."
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      A brief description that appears below the title.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo</Label>
                    <div className="flex items-center gap-4">
                      {formData.logo_url && (
                        <div className="relative w-16 h-16 border rounded overflow-hidden">
                          <img
                            src={formData.logo_url}
                            alt="Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex gap-2">
                          <Label
                            htmlFor="logo_upload"
                            className="flex items-center justify-center flex-1 h-10 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 cursor-pointer"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploading ? "Uploading..." : "Upload Logo"}
                          </Label>
                          {formData.logo_url && (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10"
                              onClick={async () => {
                                try {
                                  if (formData.logo_url) {
                                    // Extract the file path from the URL
                                    const url = new URL(formData.logo_url);
                                    const pathParts = url.pathname.split('/');
                                    const filePath = pathParts[pathParts.length - 1];

                                    if (filePath && filePath.startsWith('logo-')) {
                                      const { error } = await supabase.storage
                                        .from(STORAGE_BUCKET_NAME)
                                        .remove([filePath]);

                                      if (error) {
                                        throw error;
                                      }

                                      console.log("Deleted logo:", filePath);
                                    }
                                  }

                                  // Update form data to remove logo URL
                                  setFormData((prev) => ({ ...prev, logo_url: "" }));

                                  toast({
                                    title: "Logo removed",
                                    description: "Your logo has been removed successfully.",
                                  });
                                } catch (err: any) {
                                  console.error("Error removing logo:", err);
                                  toast({
                                    title: "Error",
                                    description: err?.message || "Could not remove logo. Please try again.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <input
                          id="logo_upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="sr-only"
                          disabled={isUploading}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Recommended size: 200x200px. Max 2MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accent_color">Accent Color</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="accent_color"
                        name="accent_color"
                        type="color"
                        value={formData.accent_color}
                        onChange={handleChange}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        id="accent_color_text"
                        name="accent_color"
                        type="text"
                        value={formData.accent_color}
                        onChange={handleChange}
                        placeholder="#6366f1"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This color will be used for buttons and highlights on your form.
                    </p>
                  </div>
                </>
              )}

              {useGlobalSettings && globalSettings && (
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2">Using Global Form Settings</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    This appointment type will use your global form settings. You can customize these settings in the Form Settings page.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Form Title:</span>
                      <span className="text-sm">{globalSettings.form_title || "Book an Appointment"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Accent Color:</span>
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: globalSettings.accent_color || "#6366f1" }}
                        ></div>
                        <span className="text-sm">{globalSettings.accent_color || "#6366f1"}</span>
                      </div>
                    </div>
                    {globalSettings.logo_url && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Logo:</span>
                        <img
                          src={globalSettings.logo_url}
                          alt="Global logo"
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      <TabsContent value="preview" className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Preview</CardTitle>
            <CardDescription>
              Preview how your booking form will appear to clients for this appointment type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormPreview
              formTitle={useGlobalSettings && globalSettings ? (globalSettings.form_title || "Book an Appointment") : formData.form_title}
              formDescription={useGlobalSettings && globalSettings ? (globalSettings.form_description || "Fill out the form below to schedule your appointment.") : formData.form_description}
              logoUrl={useGlobalSettings && globalSettings ? globalSettings.logo_url : formData.logo_url}
              accentColor={useGlobalSettings && globalSettings ? (globalSettings.accent_color || "#6366f1") : formData.accent_color}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
