"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2, Upload, Share, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormPreview } from "@/components/settings/form-preview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


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
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Generate or get share token
  const generateShareToken = async () => {
    setIsGenerating(true);
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if a token already exists
      const { data: existingToken } = await supabase
        .from("form_share_tokens")
        .select("token")
        .eq("user_id", user.id)
        .single();

      if (existingToken?.token) {
        setShareToken(existingToken.token);
        setIsGenerating(false);
        return;
      }

      // If no token exists, create one via the API
      const response = await fetch('/api/form/share-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API error:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Could not generate share link. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setShareToken(result.shareToken.token);
    } catch (err) {
      console.error('Error generating share token:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy share link to clipboard
  const copyToClipboard = () => {
    if (shareToken) {
      const link = `${window.location.origin}/book/${shareToken}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "The booking form link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Open share dialog
  const handleOpenShareDialog = async () => {
    setIsShareDialogOpen(true);
    if (!shareToken) {
      await generateShareToken();
    }
  };

  // Open form in new tab
  const openFormInNewTab = () => {
    if (shareToken) {
      window.open(`${window.location.origin}/book/${shareToken}`, '_blank');
    }
  };

  return (
    <Tabs defaultValue="customize">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="customize">Customize Form</TabsTrigger>
        <TabsTrigger value="preview">Preview & Share</TabsTrigger>
      </TabsList>

      <TabsContent value="customize" className="mt-6">
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
              Preview how your booking form will appear to clients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormPreview
              formTitle={formData.form_title}
              formDescription={formData.form_description}
              logoUrl={formData.logo_url}
              accentColor={formData.accent_color}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 items-start sm:items-center">
            <Button
              onClick={handleOpenShareDialog}
              className="w-full sm:w-auto gap-2"
            >
              <Share className="h-4 w-4" />
              Share Form Link
            </Button>
            <Button
              variant="outline"
              onClick={openFormInNewTab}
              className="w-full sm:w-auto gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Type-Specific Form Settings</CardTitle>
            <CardDescription>
              You can customize form settings for each appointment type separately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The settings on this page are global and will be used for all appointment types by default.
              However, you can override these settings for specific appointment types.
            </p>
            <div className="flex items-center justify-between border p-4 rounded-md bg-muted/50">
              <div>
                <h4 className="font-medium">Customize per appointment type</h4>
                <p className="text-sm text-muted-foreground">
                  Create custom form settings for each appointment type
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/settings/appointment-types")}
              >
                Manage Appointment Types
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Booking Form</DialogTitle>
            <DialogDescription>
              Share this link with your clients to let them book appointments with you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <label htmlFor="link" className="sr-only">
                  Link
                </label>
                <Input
                  id="link"
                  value={shareToken ? `${window.location.origin}/book/${shareToken}` : 'Generating link...'}
                  readOnly
                />
              </div>
              <Button
                size="icon"
                onClick={copyToClipboard}
                disabled={!shareToken || isGenerating}
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> :
                 copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This link allows clients to book appointments directly with you. You can share it on your website, social media, or via email.
            </p>

            {/* Add section for appointment type-specific links */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-2">Appointment Type-Specific Links</h4>
              <p className="text-sm text-muted-foreground mb-4">
                You can also share links for specific appointment types. These links will pre-select the appointment type for your clients.
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Select
                    onValueChange={(value) => {
                      if (shareToken) {
                        navigator.clipboard.writeText(`${window.location.origin}/book/${shareToken}?type=${value}`);
                        toast({
                          title: "Link copied",
                          description: "The type-specific booking link has been copied to your clipboard.",
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an appointment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {appointmentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
