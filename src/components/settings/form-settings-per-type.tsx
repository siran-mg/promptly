"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
  Loader2, Upload, Palette, Type, FileText, Image, Save, Eye,
  Trash2, RefreshCw, Check
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/types/supabase";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { useTranslations } from "next-intl";

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
  const t = useTranslations();

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
            title: t('common.errorLabel'),
            description: t('settings.appointmentTypes.errors.loadGlobalFailed'),
            variant: "destructive",
          });
          return;
        }

        setGlobalSettings(globalData || {
          form_title: t('settings.appointmentTypes.defaultTitle'),
          form_description: t('settings.appointmentTypes.defaultDescription'),
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
            title: t('common.errorLabel'),
            description: t('settings.appointmentTypes.errors.loadTypeFailed'),
            variant: "destructive",
          });
          return;
        }

        // If we have type-specific settings, use them
        if (typeData) {
          setUseGlobalSettings(false);
          setFormData({
            form_title: typeData.form_title || appointmentType?.name || t('settings.appointmentTypes.defaultTitle'),
            form_description: typeData.form_description || t('settings.appointmentTypes.defaultDescription'),
            logo_url: typeData.logo_url || "",
            accent_color: typeData.accent_color || appointmentType?.color || "#6366f1",
          });
        } else {
          // Otherwise, use global settings as a starting point
          setUseGlobalSettings(true);
          setFormData({
            form_title: globalData?.form_title || t('settings.appointmentTypes.defaultTitle'),
            form_description: globalData?.form_description || t('settings.appointmentTypes.defaultDescription'),
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
          title: t('settings.appointmentTypes.settingsSaved'),
          description: t('settings.appointmentTypes.usingGlobalSettings'),
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
          title: t('settings.appointmentTypes.settingsSaved'),
          description: t('settings.appointmentTypes.typeSettingsSaved'),
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
        <p className="text-muted-foreground">{t('settings.formSettings.loading')}</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="customize">
      <TabsList className="grid w-full grid-cols-2 p-1 bg-indigo-50/50 border-indigo-100">
        <TabsTrigger
          value="customize"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <Palette className="h-4 w-4" />
          {t('settings.appointmentTypes.customizeForm')}
        </TabsTrigger>
        <TabsTrigger
          value="preview"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <Eye className="h-4 w-4" />
          {t('settings.appointmentTypes.previewTab')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="customize" className="mt-6">
        <Card className="border-indigo-100 overflow-hidden">
          <div className="h-1 bg-indigo-600"></div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              {t('settings.appointmentTypes.customizeForm')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('settings.appointmentTypes.formCustomizationDescription')}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8">
              <div className="flex items-center p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 gap-3">
                <Switch
                  id="use-global-settings"
                  checked={useGlobalSettings}
                  onCheckedChange={setUseGlobalSettings}
                  className="data-[state=checked]:bg-indigo-600"
                />
                <div className="flex-1">
                  <Label htmlFor="use-global-settings" className="font-medium text-sm">
                    {t('settings.appointmentTypes.useGlobalSettings')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.appointmentTypes.useGlobalSettingsDescription')}
                  </p>
                </div>
              </div>

              {!useGlobalSettings && (
                <>
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
                          placeholder={t('settings.appointmentTypes.defaultTitle')}
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
                          placeholder={t('settings.appointmentTypes.defaultDescription')}
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
                              <p className="text-xs text-muted-foreground">{t('settings.appointmentTypes.noLogo')}</p>
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
                              {isUploading ? t('settings.appointmentTypes.uploading') : t('settings.appointmentTypes.uploadLogo')}
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
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t('settings.appointmentTypes.removeLogo')}
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
                            <p className="font-medium">{t('settings.appointmentTypes.logoRequirements')}</p>
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
                            <p className="font-medium">{t('settings.appointmentTypes.colorUsage')}</p>
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
                </>
              )}

              {useGlobalSettings && globalSettings && (
                <div className="bg-indigo-50/50 p-6 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-medium text-indigo-700">{t('settings.appointmentTypes.usingGlobalSettings')}</h4>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-indigo-100 mb-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Type className="h-4 w-4 text-indigo-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Form Title</p>
                          <p className="text-sm">{globalSettings.form_title || "Book an Appointment"}</p>
                        </div>
                      </div>

                      {globalSettings.form_description && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-indigo-600 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Form Description</p>
                            <p className="text-sm">{globalSettings.form_description}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <Palette className="h-4 w-4 text-indigo-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Accent Color</p>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-200"
                              style={{ backgroundColor: globalSettings.accent_color || "#6366f1" }}
                            ></div>
                            <p className="text-sm">{globalSettings.accent_color || "#6366f1"}</p>
                          </div>
                        </div>
                      </div>

                      {globalSettings.logo_url && (
                        <div className="flex items-start gap-2">
                          <Image className="h-4 w-4 text-indigo-600 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Logo</p>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 border rounded-md overflow-hidden bg-white">
                                <img
                                  src={globalSettings.logo_url}
                                  alt="Global logo"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {t('settings.appointmentTypes.customizeGlobalToggle')}
                  </p>
                </div>
              )}
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
                    title: t('settings.appointmentTypes.colorsReset'),
                    description: t('settings.appointmentTypes.colorsResetDescription'),
                  });
                }}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('settings.appointmentTypes.resetToDefault')}
              </Button>
              <PrimaryActionButton
                type="submit"
                disabled={isSaving}
                isLoading={isSaving}
                loadingText={t('common.savingChanges')}
                icon={Save}
                variant="indigo"
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
                formTitle={useGlobalSettings && globalSettings ? (globalSettings.form_title || "Book an Appointment") : formData.form_title}
                formDescription={useGlobalSettings && globalSettings ? (globalSettings.form_description || "Fill out the form below to schedule your appointment.") : formData.form_description}
                logoUrl={useGlobalSettings && globalSettings ? globalSettings.logo_url : formData.logo_url}
                accentColor={useGlobalSettings && globalSettings ? (globalSettings.accent_color || "#6366f1") : formData.accent_color}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t bg-gray-50/50 py-4">
            <div className="w-full flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {t('settings.appointmentTypes.previewClientView')}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: appointmentType?.color || '#6366f1' }}
                ></div>
                <span className="font-medium">{appointmentType?.name}</span>
                <span className="text-muted-foreground">• {appointmentType?.duration || 60} minutes</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
