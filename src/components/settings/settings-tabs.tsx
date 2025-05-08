"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, Share, Bell, Mail } from "lucide-react";
import { ShareFormButton } from "@/components/dashboard/share-form-button";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface SettingsTabsProps {
  profileSettings: React.ReactNode;
  formSettings: React.ReactNode;
  notificationSettings?: React.ReactNode;
  emailSettings?: React.ReactNode;
}

export function SettingsTabs({ profileSettings, formSettings, notificationSettings, emailSettings }: SettingsTabsProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("profile");
  const searchParams = useSearchParams();
  const router = useRouter();
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
    if (tab === 'profile' || tab === 'form' || tab === 'notifications' || tab === 'email') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle tab change with navigation
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/settings?tab=${value}`);
  };

  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-8 p-1 bg-indigo-50/50 border-indigo-100 overflow-x-auto">
        <TabsTrigger
          value="profile"
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">{t('settings.profile')}</span>
        </TabsTrigger>
        <TabsTrigger
          value="form"
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">{t('settings.formSettingsMenu')}</span>
        </TabsTrigger>
        <TabsTrigger
          value="email"
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">{t('settings.emailSettingsMenu')}</span>
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <Bell className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">{t('settings.notifications')}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        {profileSettings}
      </TabsContent>

      <TabsContent value="form" className="space-y-6">
        <div className="flex flex-col gap-4 mb-6 p-4 sm:p-6 bg-indigo-50/50 rounded-lg border border-indigo-100">
          <div>
            <h3 className="text-base sm:text-lg font-medium flex items-center gap-2">
              <Share className="h-5 w-5 text-indigo-600" />
              {t('settings.formSettingsSection.shareForm')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {t('settings.formSettingsSection.shareFormDescription')}
            </p>
          </div>
          <div className="w-full sm:w-auto self-start">
            {userId && <ShareFormButton userId={userId} className="indigo" />}
          </div>
        </div>

        {formSettings}
      </TabsContent>

      <TabsContent value="email" className="space-y-6">
        {emailSettings || (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
            <Mail className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('settings.email.title')}</h3>
            <p className="text-sm text-gray-500 text-center mb-4">{t('settings.email.description')}</p>
            <Button
              onClick={() => router.push('/dashboard/settings/email')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {t('settings.email.title')}
            </Button>
          </div>
        )}
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        {notificationSettings}
      </TabsContent>
    </Tabs>
  );
}
