"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MessageSquare, MessageSquareOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase";
import { formatPhoneNumber, isValidPhoneNumber } from "@/lib/sms-notifications";

export function SmsNotificationManager() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const { toast } = useToast();
  const t = useTranslations();
  const supabase = createClient();

  // Load SMS subscription settings
  useEffect(() => {
    const loadSmsSettings = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Check if user has an SMS subscription
        const { data, error } = await supabase
          .from("sms_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error("Error fetching SMS subscription:", error);
          toast({
            title: t('common.error'),
            description: t('settings.notificationSettings.errors.loadFailed'),
            variant: "destructive",
          });
          return;
        }

        if (data) {
          setEnabled(data.enabled);
          setPhoneNumber(data.phone_number || "");
        }
      } catch (error) {
        console.error("Error loading SMS settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSmsSettings();
  }, [supabase, toast, t]);

  const handleToggle = async (checked: boolean) => {
    if (checked && !phoneNumber) {
      setPhoneError(t('settings.notificationSettings.smsSettings.phoneRequired'));
      return;
    }

    if (checked && !isValidPhoneNumber(phoneNumber)) {
      setPhoneError(t('settings.notificationSettings.smsSettings.invalidPhone'));
      return;
    }

    setPhoneError("");
    await saveSettings(checked, phoneNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    setPhoneError("");
  };

  const handleSavePhone = async () => {
    if (!phoneNumber) {
      setPhoneError(t('settings.notificationSettings.smsSettings.phoneRequired'));
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      setPhoneError(t('settings.notificationSettings.smsSettings.invalidPhone'));
      return;
    }

    setPhoneError("");
    await saveSettings(enabled, phoneNumber);
  };

  const saveSettings = async (isEnabled: boolean, phone: string) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: t('common.error'),
          description: t('common.unauthorized'),
          variant: "destructive",
        });
        return;
      }

      const formattedPhone = formatPhoneNumber(phone);

      // Check if user already has an SMS subscription
      const { data, error: fetchError } = await supabase
        .from("sms_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let error;

      if (data) {
        // Update existing subscription
        const { error: updateError } = await supabase
          .from("sms_subscriptions")
          .update({
            enabled: isEnabled,
            phone_number: formattedPhone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        error = updateError;
      } else {
        // Create new subscription
        const { error: insertError } = await supabase
          .from("sms_subscriptions")
          .insert({
            user_id: user.id,
            enabled: isEnabled,
            phone_number: formattedPhone,
          });

        error = insertError;
      }

      if (error) {
        throw error;
      }

      setEnabled(isEnabled);
      toast({
        title: t('settings.notificationSettings.smsSettings.settingsSaved'),
        description: isEnabled
          ? t('settings.notificationSettings.smsSettings.enabled')
          : t('settings.notificationSettings.smsSettings.disabled'),
      });
    } catch (error) {
      console.error("Error saving SMS settings:", error);
      toast({
        title: t('common.error'),
        description: t('settings.notificationSettings.errors.saveFailed'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="sms-notifications"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={loading || saving}
        />
        <Label htmlFor="sms-notifications" className="flex items-center gap-2 cursor-pointer">
          {enabled ? (
            <MessageSquare className="h-4 w-4 text-indigo-600 flex-shrink-0" />
          ) : (
            <MessageSquareOff className="h-4 w-4 text-gray-500 flex-shrink-0" />
          )}
          <span className="text-sm">{t('settings.notificationSettings.smsSettings.title')}</span>
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone-number" className="text-sm">
          {t('settings.notificationSettings.smsSettings.phoneNumber')}
        </Label>
        <div className="flex gap-2">
          <Input
            id="phone-number"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={phoneNumber}
            onChange={handlePhoneChange}
            className={phoneError ? "border-red-500" : ""}
            disabled={loading}
          />
          <Button
            size="sm"
            onClick={handleSavePhone}
            disabled={loading || saving}
          >
            {t('common.save')}
          </Button>
        </div>
        {phoneError && (
          <p className="text-xs text-red-500">{phoneError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {t('settings.notificationSettings.smsSettings.phoneHelp')}
        </p>
      </div>
    </div>
  );
}
