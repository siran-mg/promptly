"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [settings, setSettings] = useState<FormSettings | null>(null);
  const [formData, setFormData] = useState({
    form_title: "",
    form_description: "",
    logo_url: "",
    accent_color: "#6366f1",
  });

  // Fetch form settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("form_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching form settings:", error);
          toast({
            title: "Error",
            description: "Could not load form settings. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setSettings(data);
        setFormData({
          form_title: data.form_title || "Book an Appointment",
          form_description: data.form_description || "Fill out the form below to schedule your appointment.",
          logo_url: data.logo_url || "",
          accent_color: data.accent_color || "#6366f1",
        });
      } catch (err) {
        console.error("Error in fetchSettings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [router, supabase, toast]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
      if (!user) return;

      // If there's an existing logo, try to delete it
      if (formData.logo_url) {
        try {
          // Extract the file path from the URL
          const url = new URL(formData.logo_url);
          const pathParts = url.pathname.split('/');
          const filePath = pathParts[pathParts.length - 1];

          if (filePath && filePath.startsWith('logo-')) {
            await supabase.storage
              .from("logos")
              .remove([filePath]);
            console.log("Deleted old logo:", filePath);
          }
        } catch (deleteErr) {
          // Just log the error but continue with the upload
          console.error("Error deleting old logo:", deleteErr);
        }
      }

      // Upload file to Supabase Storage
      const fileName = `logo-${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from("logos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(data.path);

      // Update form data with the public URL
      setFormData((prev) => ({ ...prev, logo_url: publicUrl }));

      toast({
        title: "Logo uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    } catch (err) {
      console.error("Error uploading logo:", err);
      toast({
        title: "Upload failed",
        description: "Could not upload logo. Please try again.",
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("form_settings")
        .update({
          form_title: formData.form_title,
          form_description: formData.form_description,
          logo_url: formData.logo_url,
          accent_color: formData.accent_color,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Settings saved",
        description: "Your form settings have been saved successfully.",
      });

      // Refresh settings
      const { data } = await supabase
        .from("form_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setSettings(data);
    } catch (err) {
      console.error("Error saving form settings:", err);
      toast({
        title: "Save failed",
        description: "Could not save form settings. Please try again.",
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
    <Card>
      <CardHeader>
        <CardTitle>Form Customization</CardTitle>
        <CardDescription>
          Customize how your appointment booking form appears to clients.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
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
                              await supabase.storage
                                .from("logos")
                                .remove([filePath]);
                              console.log("Deleted logo:", filePath);
                            }
                          }

                          // Update form data to remove logo URL
                          setFormData((prev) => ({ ...prev, logo_url: "" }));

                          toast({
                            title: "Logo removed",
                            description: "Your logo has been removed successfully.",
                          });
                        } catch (err) {
                          console.error("Error removing logo:", err);
                          toast({
                            title: "Error",
                            description: "Could not remove logo. Please try again.",
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
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
