"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface EmailSettingsProps {
  locale: string;
}

interface EmailSettings {
  id?: string;
  user_id?: string;
  admin_confirmation_subject?: string | null;
  admin_confirmation_greeting?: string | null;
  admin_confirmation_footer?: string | null;
  client_confirmation_subject?: string | null;
  client_confirmation_greeting?: string | null;
  client_confirmation_footer?: string | null;
  client_rejection_subject?: string | null;
  client_rejection_greeting?: string | null;
  client_rejection_footer?: string | null;
  send_client_emails?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function EmailSettings({ locale }: EmailSettingsProps) {
  // We're keeping the locale prop for future internationalization features
  const t = useTranslations("settings.email");
  const tCommon = useTranslations("common");
  const supabase = createClient();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<EmailSettings>({
    send_client_emails: true,
  });

  // Fetch email settings
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          toast({
            title: t("errors.authRequired"),
            description: t("errors.loginRequired"),
            variant: "destructive",
          });
          return;
        }

        // Check if email_settings table exists
        const { error: tableCheckError } = await supabase
          .from('email_settings')
          .select('id')
          .limit(1);

        // If table doesn't exist, create it
        if (tableCheckError) {
          console.log('Email settings table might not exist, will be created when saving');
        }

        // Try to fetch existing settings
        const { data, error } = await supabase
          .from('email_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching email settings:', error);
          toast({
            title: t("errors.loadFailed"),
            description: t("errors.tryAgain"),
            variant: "destructive",
          });
          return;
        }

        // If settings exist, use them
        if (data) {
          setSettings(data);
        } else {
          // Otherwise use defaults with the user_id
          setSettings({
            user_id: session.user.id,
            send_client_emails: true,
          });
        }
      } catch (error) {
        console.error('Error in fetchSettings:', error);
        toast({
          title: t("errors.loadFailed"),
          description: t("errors.unexpectedError"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [supabase, toast, t]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: t("errors.authRequired"),
          description: t("errors.loginRequired"),
          variant: "destructive",
        });
        return;
      }

      // Ensure user_id is set
      const dataToSave = {
        ...settings,
        user_id: session.user.id,
      };

      // Check if we're updating or inserting
      let operation;
      if (settings.id) {
        // Update existing settings
        operation = supabase
          .from('email_settings')
          .update(dataToSave)
          .eq('id', settings.id);
      } else {
        // Insert new settings
        operation = supabase
          .from('email_settings')
          .insert(dataToSave);
      }

      const { error } = await operation;

      if (error) {
        console.error('Error saving email settings:', error);
        toast({
          title: t("errors.saveFailed"),
          description: t("errors.tryAgain"),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t("settingsSaved"),
        description: t("settingsSavedDescription"),
      });

      // Refresh settings after save
      const { data } = await supabase
        .from('email_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: t("errors.saveFailed"),
        description: t("errors.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  // Handle switch changes
  const handleSwitchChange = (checked: boolean) => {
    setSettings(prev => ({ ...prev, send_client_emails: checked }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("generalSettings")}</CardTitle>
              <CardDescription>{t("generalSettingsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="send-client-emails"
                  checked={settings.send_client_emails}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="send-client-emails">{t("sendClientEmails")}</Label>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{t("sendClientEmailsDescription")}</p>
            </CardContent>
          </Card>

          <Tabs defaultValue="admin-confirmation">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="admin-confirmation">{t("adminConfirmation")}</TabsTrigger>
              <TabsTrigger value="client-confirmation">{t("clientConfirmation")}</TabsTrigger>
              <TabsTrigger value="client-rejection">{t("clientRejection")}</TabsTrigger>
            </TabsList>

            <TabsContent value="admin-confirmation" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("adminConfirmation")}</CardTitle>
                  <CardDescription>{t("adminConfirmationDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_confirmation_subject">{t("emailSubject")}</Label>
                    <Input
                      id="admin_confirmation_subject"
                      name="admin_confirmation_subject"
                      value={settings.admin_confirmation_subject || ''}
                      onChange={handleChange}
                      placeholder={t("adminConfirmationSubjectPlaceholder", { clientName: "{name}" })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_confirmation_greeting">{t("emailGreeting")}</Label>
                    <Input
                      id="admin_confirmation_greeting"
                      name="admin_confirmation_greeting"
                      value={settings.admin_confirmation_greeting || ''}
                      onChange={handleChange}
                      placeholder={t("adminConfirmationGreetingPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_confirmation_footer">{t("emailFooter")}</Label>
                    <Textarea
                      id="admin_confirmation_footer"
                      name="admin_confirmation_footer"
                      value={settings.admin_confirmation_footer || ''}
                      onChange={handleChange}
                      placeholder={t("adminConfirmationFooterPlaceholder")}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="client-confirmation" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("clientConfirmation")}</CardTitle>
                  <CardDescription>{t("clientConfirmationDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_confirmation_subject">{t("emailSubject")}</Label>
                    <Input
                      id="client_confirmation_subject"
                      name="client_confirmation_subject"
                      value={settings.client_confirmation_subject || ''}
                      onChange={handleChange}
                      placeholder={t("clientConfirmationSubjectPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_confirmation_greeting">{t("emailGreeting")}</Label>
                    <Input
                      id="client_confirmation_greeting"
                      name="client_confirmation_greeting"
                      value={settings.client_confirmation_greeting || ''}
                      onChange={handleChange}
                      placeholder={t("clientConfirmationGreetingPlaceholder", { clientName: "{name}" })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_confirmation_footer">{t("emailFooter")}</Label>
                    <Textarea
                      id="client_confirmation_footer"
                      name="client_confirmation_footer"
                      value={settings.client_confirmation_footer || ''}
                      onChange={handleChange}
                      placeholder={t("clientConfirmationFooterPlaceholder")}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="client-rejection" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("clientRejection")}</CardTitle>
                  <CardDescription>{t("clientRejectionDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_rejection_subject">{t("emailSubject")}</Label>
                    <Input
                      id="client_rejection_subject"
                      name="client_rejection_subject"
                      value={settings.client_rejection_subject || ''}
                      onChange={handleChange}
                      placeholder={t("clientRejectionSubjectPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_rejection_greeting">{t("emailGreeting")}</Label>
                    <Input
                      id="client_rejection_greeting"
                      name="client_rejection_greeting"
                      value={settings.client_rejection_greeting || ''}
                      onChange={handleChange}
                      placeholder={t("clientRejectionGreetingPlaceholder", { clientName: "{name}" })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_rejection_footer">{t("emailFooter")}</Label>
                    <Textarea
                      id="client_rejection_footer"
                      name="client_rejection_footer"
                      value={settings.client_rejection_footer || ''}
                      onChange={handleChange}
                      placeholder={t("clientRejectionFooterPlaceholder")}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon("saving")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {tCommon("saveChanges")}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
