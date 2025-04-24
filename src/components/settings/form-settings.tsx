"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Loader2, Upload, Share, ExternalLink, Palette, Type, FileText,
  Image, Save, Eye, Link, Check, Trash2, RefreshCw, Calendar
} from "lucide-react";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormPreview } from "@/components/settings/form-preview";
import { ShareDialog } from "@/components/share/share-dialog";


interface FormSettings {
  id: string;
  user_id: string;
  form_title: string;
  form_description: string;
  logo_url: string | null;
  accent_color: string;
}

export function FormSettings() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    form_title: "",
    form_description: "",
    logo_url: "",
    accent_color: "#6366f1",
  });

  // Fetch form settings and appointment types
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch form settings
        const { data, error } = await supabase
          .from("form_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error("Error fetching form settings:", error);
          toast({
            title: "Error",
            description: "Could not load form settings. Please try again.",
            variant: "destructive",
          });
        } else if (data) {
          setFormData({
            form_title: data.form_title || "Book an Appointment",
            form_description: data.form_description || "Fill out the form below to schedule your appointment.",
            logo_url: data.logo_url || "",
            accent_color: data.accent_color || "#6366f1",
          });
        }

        // Fetch appointment types in the same effect
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
  }, [router, supabase, toast]);

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
      const safeFileName = `logo-${user.id}-${Date.now()}.${fileExt}`;

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

    console.log("Submitting global form settings:", formData);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First check if a record already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from("form_settings")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error("Error checking existing record:", checkError);
        // Continue anyway, we'll try the upsert
      }

      // Prepare the data to save
      const formSettingsData = {
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
          .from("form_settings")
          .update(formSettingsData)
          .eq("id", existingRecord.id);

        error = updateError;
      } else {
        // Otherwise insert a new record
        const { error: insertError } = await supabase
          .from("form_settings")
          .insert({
            ...formSettingsData,
            user_id: user.id
          });

        error = insertError;
      }

      if (error) {
        throw error;
      }

      toast({
        title: "Settings saved",
        description: "Your form settings have been saved successfully.",
      });

      // Refresh form data
      const { data } = await supabase
        .from("form_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setFormData({
          form_title: data.form_title || "Book an Appointment",
          form_description: data.form_description || "Fill out the form below to schedule your appointment.",
          logo_url: data.logo_url || "",
          accent_color: data.accent_color || "#6366f1",
        });
      }
    } catch (err: any) {
      console.error("Error saving form settings:", err);

      // Provide more specific error messages
      let errorMessage = "Could not save form settings. Please try again.";

      // Check for specific error codes or messages
      if (err?.code === "23505") {
        errorMessage = "A record with this user already exists. Try refreshing the page.";
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
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-muted-foreground">Loading your form settings...</p>
      </div>
    );
  }

  // Handle customize form button
  const handleCustomizeForm = () => {
    router.push('/dashboard/settings?tab=customize');
    setIsShareDialogOpen(false);
  };

  // Open share dialog
  const handleOpenShareDialog = () => {
    setIsShareDialogOpen(true);
  };

  // Open form in new tab - now handled by ShareDialog component
  const openFormInNewTab = () => {
    // This will be handled by the ShareDialog component
    setIsShareDialogOpen(true);
  };

  return (
    <Tabs defaultValue="customize">
      <TabsList className="grid w-full grid-cols-2 p-1 bg-indigo-50/50 border-indigo-100">
        <TabsTrigger
          value="customize"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <Palette className="h-4 w-4" />
          Customize Form
        </TabsTrigger>
        <TabsTrigger
          value="preview"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <Eye className="h-4 w-4" />
          Preview & Share
        </TabsTrigger>
      </TabsList>

      <TabsContent value="customize" className="mt-6">
        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              Form Customization
            </CardTitle>
            <CardDescription className="text-base">
              Customize how your appointment booking form appears to clients
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8">
          <div className="space-y-4">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Type className="h-5 w-5 text-indigo-600" />
              Text Content
            </h3>

            <div className="space-y-2">
              <Label htmlFor="form_title" className="text-sm font-medium">Form Title</Label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
                <Input
                  id="form_title"
                  name="form_title"
                  value={formData.form_title}
                  onChange={handleChange}
                  placeholder="Book an Appointment"
                  className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                This title appears at the top of your booking form.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="form_description" className="text-sm font-medium">Form Description</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-indigo-600" />
                <Textarea
                  id="form_description"
                  name="form_description"
                  value={formData.form_description}
                  onChange={handleChange}
                  placeholder="Fill out the form below to schedule your appointment."
                  className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                  rows={3}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                A brief description that appears below the title.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Image className="h-5 w-5 text-indigo-600" />
              Brand Identity
            </h3>

            <div className="space-y-2">
              <Label htmlFor="logo" className="text-sm font-medium">Company Logo</Label>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <div className="flex items-center justify-center w-32 h-32 bg-white rounded-lg border-2 border-dashed border-indigo-200 overflow-hidden">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <Image className="w-8 h-8 text-indigo-300 mb-2" />
                      <p className="text-xs text-muted-foreground">No logo uploaded</p>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Label
                      htmlFor="logo_upload"
                      className="flex items-center justify-center flex-1 h-10 px-4 py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-300 rounded-md shadow-sm hover:bg-indigo-50 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? "Uploading..." : "Upload Logo"}
                    </Label>
                    {formData.logo_url && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
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
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Logo
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
                  <div className="text-sm space-y-1">
                    <p className="font-medium">Logo requirements:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Recommended size: 200x200 pixels</li>
                      <li>• Maximum file size: 2MB</li>
                      <li>• Supported formats: PNG, JPG, SVG</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              Color Scheme
            </h3>

            <div className="space-y-2">
              <Label htmlFor="accent_color" className="text-sm font-medium">Accent Color</Label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <div
                  className="w-16 h-16 rounded-full border-4 border-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: formData.accent_color }}
                ></div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4 w-full">
                    <Input
                      id="accent_color"
                      name="accent_color"
                      type="color"
                      value={formData.accent_color}
                      onChange={handleChange}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <div className="relative flex-1">
                      <Palette className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
                      <Input
                        id="accent_color_text"
                        name="accent_color"
                        type="text"
                        value={formData.accent_color}
                        onChange={handleChange}
                        placeholder="#6366f1"
                        className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">This color will be used for:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Buttons and call-to-action elements</li>
                      <li>• Highlights and accents throughout the form</li>
                      <li>• Selected states and interactive elements</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </CardContent>
            <CardFooter className="border-t bg-gray-50/50 py-4 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    ...formData,
                    accent_color: "#6366f1"
                  });
                  toast({
                    title: "Colors reset",
                    description: "Accent color has been reset to default.",
                  });
                }}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
              <PrimaryActionButton
                type="submit"
                disabled={isSaving}
                isLoading={isSaving}
                loadingText="Saving Changes..."
                icon={Save}
                variant="indigo"
              >
                Save Form Settings
              </PrimaryActionButton>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      <TabsContent value="preview" className="mt-6 space-y-6">
        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Eye className="h-5 w-5 text-indigo-600" />
              Form Preview
            </CardTitle>
            <CardDescription className="text-base">
              Preview how your booking form will appear to clients
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="bg-indigo-50/30 p-6 rounded-lg border border-indigo-100">
              <FormPreview
                formTitle={formData.form_title}
                formDescription={formData.form_description}
                logoUrl={formData.logo_url}
                accentColor={formData.accent_color}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t bg-gray-50/50 py-4 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="space-y-1 w-full sm:w-auto">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Link className="h-4 w-4 text-indigo-600" />
                Share with clients
              </h4>
              <p className="text-xs text-muted-foreground">
                Generate a unique link for clients to book appointments
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <PrimaryActionButton
                onClick={handleOpenShareDialog}
                icon={Share}
                variant="indigo"
              >
                Share Booking Link
              </PrimaryActionButton>
              <Button
                variant="outline"
                onClick={openFormInNewTab}
                className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Type-Specific Form Settings
            </CardTitle>
            <CardDescription className="text-base">
              Customize form settings for each appointment type separately
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="bg-indigo-50/30 p-6 rounded-lg border border-indigo-100 space-y-6">
              <div className="flex flex-col gap-2">
                <h4 className="font-medium text-indigo-700">Global vs. Type-Specific Settings</h4>
                <p className="text-sm text-muted-foreground">
                  The settings on this page are global and will be used for all appointment types by default.
                  However, you can override these settings for specific appointment types.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {appointmentTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex flex-col justify-between p-4 rounded-lg bg-white border border-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: type.color || '#6366f1' }}
                      ></div>
                      <div>
                        <h5 className="font-medium">{type.name}</h5>
                        <p className="text-xs text-muted-foreground">
                          {type.duration} min • {type.is_default ? 'Default type' : 'Custom type'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => router.push(`/dashboard/settings?tab=appointment-types&appointmentTypeId=${type.id}&view=form`)}
                    >
                      <Palette className="h-3.5 w-3.5 mr-2" />
                      Customize Form
                    </Button>
                  </div>
                ))}

                {appointmentTypes.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-dashed border-indigo-200">
                    <Calendar className="h-10 w-10 text-indigo-300 mb-2" />
                    <h4 className="font-medium">No appointment types found</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create appointment types to customize form settings for each type
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/settings?tab=appointment-types")}
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      Manage Appointment Types
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        appointmentTypes={appointmentTypes}
        onCustomizeForm={handleCustomizeForm}
      />
    </Tabs>
  );
}
