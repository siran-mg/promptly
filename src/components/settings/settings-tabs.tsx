"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, Calendar, ArrowLeft, Share, Bell } from "lucide-react";
import { ShareFormButton } from "@/components/dashboard/share-form-button";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { AppointmentTypes } from "./appointment-types";
import { CustomFieldsManager } from "./custom-fields-manager";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { AppointmentTypeFieldsClient } from "./appointment-type-fields-client";
import { AppointmentTypeFormClient } from "./appointment-type-form-client";
import { Database } from "@/types/supabase";
import { useTranslations } from "next-intl";

interface SettingsTabsProps {
  profileSettings: React.ReactNode;
  formSettings: React.ReactNode;
  notificationSettings?: React.ReactNode;
}

export function SettingsTabs({ profileSettings, formSettings, notificationSettings }: SettingsTabsProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [selectedAppointmentTypeId, setSelectedAppointmentTypeId] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<Database["public"]["Tables"]["appointment_types"]["Row"] | null>(null);
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

  // Fetch appointment type when ID changes
  useEffect(() => {
    const fetchAppointmentType = async () => {
      if (!selectedAppointmentTypeId) {
        setAppointmentType(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("appointment_types")
          .select("*")
          .eq("id", selectedAppointmentTypeId)
          .single();

        if (error) {
          console.error("Error fetching appointment type:", error);
          return;
        }

        setAppointmentType(data);
      } catch (err) {
        console.error("Error in fetchAppointmentType:", err);
      }
    };

    fetchAppointmentType();
  }, [selectedAppointmentTypeId, supabase]);

  // Check for tab parameter in URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'profile' || tab === 'form' || tab === 'appointment-types') {
      setActiveTab(tab);
    }

    const appointmentTypeId = searchParams.get('appointmentTypeId');
    if (appointmentTypeId) {
      setSelectedAppointmentTypeId(appointmentTypeId);
    } else {
      setSelectedAppointmentTypeId(null);
    }

    const view = searchParams.get('view');
    if (view === 'fields' || view === 'form') {
      setSelectedView(view);
    } else {
      setSelectedView(null);
    }
  }, [searchParams]);

  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-8 p-1 bg-indigo-50/50 border-indigo-100">
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
        <TabsTrigger
          value="appointment-types"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
        >
          <Calendar className="h-4 w-4" />
          {t('settings.appointmentTypesMenu')}
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

      <TabsContent value="appointment-types" className="space-y-6">
        {selectedAppointmentTypeId && appointmentType ? (
          <div className="space-y-6">
            {selectedView === 'fields' ? (
              <AppointmentTypeFieldsClient
                appointmentTypeId={selectedAppointmentTypeId}
                appointmentTypeName={appointmentType.name}
                onBack={() => {
                  router.push("/dashboard/settings?tab=appointment-types");
                }}
              />
            ) : selectedView === 'form' ? (
              <AppointmentTypeFormClient
                appointmentTypeId={selectedAppointmentTypeId}
                appointmentType={appointmentType}
                onBack={() => {
                  router.push("/dashboard/settings?tab=appointment-types");
                }}
              />
            ) : (
              // Default to fields view when no specific view is selected
              <AppointmentTypeFieldsClient
                appointmentTypeId={selectedAppointmentTypeId}
                appointmentTypeName={appointmentType.name}
                onBack={() => {
                  router.push("/dashboard/settings?tab=appointment-types");
                }}
              />
            )}
          </div>
        ) : (
          <AppointmentTypes
            onSelectType={(typeId) => {
              router.push(`/dashboard/settings?tab=appointment-types&appointmentTypeId=${typeId}`);
            }}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
