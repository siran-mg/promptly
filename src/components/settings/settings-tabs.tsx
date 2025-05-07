"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, Share, Bell } from "lucide-react";
import { ShareFormButton } from "@/components/dashboard/share-form-button";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface SettingsTabsProps {
  profileSettings: React.ReactNode;
  formSettings: React.ReactNode;
  notificationSettings?: React.ReactNode;
}

export function SettingsTabs({ profileSettings, formSettings, notificationSettings }: SettingsTabsProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("profile");
  const searchParams = useSearchParams();
  const supabase = createClient();
  const t = useTranslations();

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };

    getUserId();
  }, [supabase]);



  // Check for tab parameter in URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'profile' || tab === 'form' || tab === 'notifications') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8 p-1 bg-indigo-50/50 border-indigo-100">
        <TabsTrigger
          value="profile"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <User className="h-4 w-4" />
          {t('settings.profile')}
        </TabsTrigger>
        <TabsTrigger
          value="form"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <Settings className="h-4 w-4" />
          {t('settings.formSettingsMenu')}
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <Bell className="h-4 w-4" />
          {t('settings.notifications')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        {profileSettings}
      </TabsContent>

      <TabsContent value="form" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-6 bg-indigo-50/50 rounded-lg border border-indigo-100">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Share className="h-5 w-5 text-indigo-600" />
              {t('settings.formSettingsSection.shareForm')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('settings.formSettingsSection.shareFormDescription')}
            </p>
          </div>
          {userId && <ShareFormButton userId={userId} className="indigo" />}
        </div>

        {formSettings}
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        {notificationSettings}
      </TabsContent>
    </Tabs>
  );
}
