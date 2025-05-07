"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Loader2, Upload, Share, ExternalLink, Palette, Type, FileText,
  Image, Save, Eye, Link, Trash2, RefreshCw, Calendar
} from "lucide-react";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

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
  const t = useTranslations();

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
            title: t('common.errorLabel'),
            description: t('settings.appointmentTypes.errors.loadGlobalFailed'),
            variant: "destructive",
          });
        } else if (data) {
          setFormData({
            form_title: data.form_title || t('settings.appointmentTypes.defaultTitle'),
            form_description: data.form_description || t('settings.appointmentTypes.defaultDescription'),
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
        title: t('settings.formSettings.errors.invalidFileType'),
        description: t('settings.formSettings.errors.invalidFileTypeDescription'),
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({
        title: t('settings.formSettings.errors.fileTooLarge'),
        description: t('settings.formSettings.errors.fileTooLargeDescription'),
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
          title: t('settings.formSettings.errors.authError'),
          description: t('settings.formSettings.errors.authErrorDescription'),
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
        title: t('settings.formSettings.logoUploaded'),
        description: t('settings.formSettings.logoUploadedDescription'),
      });
    } catch (err: any) {
      console.error("Error uploading logo:", err);
      toast({
        title: t('settings.formSettings.errors.uploadFailed'),
        description: err?.message || t('settings.formSettings.errors.uploadFailedDescription'),
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
        title: t('settings.formSettings.settingsSaved'),
        description: t('settings.formSettings.typeSettingsSaved'),
      });

      // Refresh form data
      const { data } = await supabase
        .from("form_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setFormData({
          form_title: data.form_title || t('settings.formSettings.defaultTitle'),
          form_description: data.form_description || t('settings.formSettings.defaultDescription'),
          logo_url: data.logo_url || "",
          accent_color: data.accent_color || "#6366f1",
        });
      }
    } catch (err: any) {
      console.error("Error saving form settings:", err);

      // Provide more specific error messages
      let errorMessage = t('settings.appointmentTypes.errors.saveFailedDescription');

      // Check for specific error codes or messages
      if (err?.code === "23505") {
        errorMessage = t('settings.appointmentTypes.errors.duplicateRecord');
      } else if (err?.message) {
        errorMessage = err.message;
      }

      toast({
        title: t('settings.appointmentTypes.errors.saveFailed'),
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
        <p className="text-muted-foreground">{t('settings.appointmentTypes.loading')}</p>
      </div>
    );
  }

  // Handle customize form button
  const handleCustomizeForm = () => {
    router.push('/dashboard/settings?tab=form');
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
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <Palette className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">{t('settings.appointmentTypes.customizeForm')}</span>
        </TabsTrigger>
        <TabsTrigger
          value="preview"
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">{t('settings.appointmentTypes.previewTab')}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="customize" className="mt-6">
        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              {t('settings.appointmentTypes.formCustomization')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('settings.appointmentTypes.formCustomizationDescription')}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8">
          <div className="space-y-4">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Type className="h-5 w-5 text-indigo-600" />
              {t('settings.appointmentTypes.textContent')}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="form_title" className="text-sm font-medium">{t('settings.appointmentTypes.formTitle')}</Label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
                <Input
                  id="form_title"
                  name="form_title"
                  value={formData.form_title}
                  onChange={handleChange}
                  placeholder={t('settings.formSettings.defaultTitle')}
                  className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('settings.appointmentTypes.formTitleHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="form_description" className="text-sm font-medium">{t('settings.appointmentTypes.formDescription')}</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-indigo-600" />
                <Textarea
                  id="form_description"
                  name="form_description"
                  value={formData.form_description}
                  onChange={handleChange}
                  placeholder={t('settings.formSettings.defaultDescription')}
                  className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                  rows={3}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('settings.appointmentTypes.formDescriptionHelp')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Image className="h-5 w-5 text-indigo-600" />
              {t('settings.appointmentTypes.brandIdentity')}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="logo" className="text-sm font-medium">{t('settings.appointmentTypes.companyLogo')}</Label>
              <div className="flex flex-col gap-4 p-3 sm:p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <div className="flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-white rounded-lg border-2 border-dashed border-indigo-200 overflow-hidden">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <Image className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-300 mb-1 sm:mb-2" />
                      <p className="text-xs text-muted-foreground">{t('settings.appointmentTypes.noLogo')}</p>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="logo_upload"
                      className="flex items-center justify-center flex-1 h-10 px-4 py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-300 rounded-md shadow-sm hover:bg-indigo-50 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{isUploading ? t('common.uploading') : t('settings.appointmentTypes.uploadLogo')}</span>
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
                              title: t('settings.appointmentTypes.logoRemoved'),
                              description: t('settings.appointmentTypes.logoRemovedDescription'),
                            });
                          } catch (err: any) {
                            console.error("Error removing logo:", err);
                            toast({
                              title: t('common.errorLabel'),
                              description: err?.message || t('settings.appointmentTypes.errors.removeLogoFailed'),
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{t('settings.appointmentTypes.removeLogo')}</span>
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
                    <p className="font-medium">{t('settings.appointmentTypes.logoRequirements')}:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• {t('settings.appointmentTypes.logoSize')}</li>
                      <li>• {t('settings.appointmentTypes.logoMaxSize')}</li>
                      <li>• {t('settings.appointmentTypes.logoFormats')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              {t('settings.appointmentTypes.colorScheme')}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="accent_color" className="text-sm font-medium">{t('settings.appointmentTypes.accentColor')}</Label>
              <div className="flex flex-col gap-4 p-3 sm:p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <div className="flex items-center justify-center">
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: formData.accent_color }}
                  ></div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                    <Input
                      id="accent_color"
                      name="accent_color"
                      type="color"
                      value={formData.accent_color}
                      onChange={handleChange}
                      className="w-full sm:w-16 h-10 p-1 cursor-pointer"
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
                    <p className="font-medium">{t('settings.appointmentTypes.colorUsage')}:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• {t('settings.appointmentTypes.colorButtons')}</li>
                      <li>• {t('settings.appointmentTypes.colorHighlights')}</li>
                      <li>• {t('settings.appointmentTypes.colorInteractive')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </CardContent>
            <CardFooter className="border-t bg-gray-50/50 py-4 flex flex-col sm:flex-row gap-3 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    ...formData,
                    accent_color: "#6366f1"
                  });
                  toast({
                    title: t('settings.appointmentTypes.colorsReset'),
                    description: t('settings.appointmentTypes.colorsResetDescription'),
                  });
                }}
                className="w-full sm:w-auto border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <RefreshCw className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t('settings.appointmentTypes.resetToDefault')}</span>
              </Button>
              <PrimaryActionButton
                type="submit"
                disabled={isSaving}
                isLoading={isSaving}
                loadingText={t('common.savingChanges')}
                icon={Save}
                variant="indigo"
                className="w-full sm:w-auto"
              >
                {t('settings.appointmentTypes.saveFormSettings')}
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
              {t('settings.appointmentTypes.formPreview')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('settings.appointmentTypes.previewDescription')}
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
          <CardFooter className="border-t bg-gray-50/50 py-4 flex flex-col gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Link className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                {t('settings.formSettingsSection.shareWithClients')}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t('settings.formSettingsSection.generateLinkDescription')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <PrimaryActionButton
                onClick={handleOpenShareDialog}
                icon={Share}
                variant="indigo"
                className="w-full sm:w-auto"
              >
                {t('settings.formSettingsSection.shareBookingLink')}
              </PrimaryActionButton>
              <Button
                variant="outline"
                onClick={openFormInNewTab}
                className="w-full sm:w-auto gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{t('settings.formSettingsSection.openInNewTab')}</span>
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              {t('settings.formSettingsSection.typeSpecificSettings')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('settings.formSettingsSection.typeSpecificDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="bg-indigo-50/30 p-6 rounded-lg border border-indigo-100 space-y-6">
              <div className="flex flex-col gap-2">
                <h4 className="font-medium text-indigo-700">{t('settings.formSettingsSection.globalVsTypeSpecific')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('settings.formSettingsSection.globalVsTypeSpecificDescription')}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                      <div className="min-w-0 flex-1">
                        <h5 className="font-medium truncate">{type.name}</h5>
                        <p className="text-xs text-muted-foreground">
                          {type.duration} min • {type.is_default ? t('settings.formSettingsSection.defaultTypeLabel') : t('settings.formSettingsSection.customType')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => router.push(`/dashboard/appointment-types/${type.id}/form`)}
                    >
                      <Palette className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                      <span className="truncate">{t('settings.formSettingsSection.customizeForm')}</span>
                    </Button>
                  </div>
                ))}

                {appointmentTypes.length === 0 && (
                  <div className="col-span-1 sm:col-span-2 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-white rounded-lg border border-dashed border-indigo-200">
                    <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-300 mb-2" />
                    <h4 className="font-medium">{t('settings.formSettingsSection.noAppointmentTypes')}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                      {t('settings.formSettingsSection.noAppointmentTypesDescription')}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/appointment-types")}
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      {t('settings.formSettingsSection.manageAppointmentTypes')}
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
