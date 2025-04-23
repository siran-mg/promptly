"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, Calendar, ArrowLeft } from "lucide-react";
import { ShareFormButton } from "@/components/dashboard/share-form-button";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { AppointmentTypes } from "./appointment-types";
import { CustomFieldsManager } from "./custom-fields-manager";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

interface SettingsTabsProps {
  profileSettings: React.ReactNode;
  formSettings: React.ReactNode;
}

export function SettingsTabs({ profileSettings, formSettings }: SettingsTabsProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [selectedAppointmentTypeId, setSelectedAppointmentTypeId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supabase = createClient();

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
    if (tab === 'profile' || tab === 'form' || tab === 'appointment-types') {
      setActiveTab(tab);
    }

    const appointmentTypeId = searchParams.get('appointmentTypeId');
    if (appointmentTypeId) {
      setSelectedAppointmentTypeId(appointmentTypeId);
    } else {
      setSelectedAppointmentTypeId(null);
    }
  }, [searchParams]);

  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="form" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Form Settings
        </TabsTrigger>
        <TabsTrigger value="appointment-types" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Appointment Types
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        {profileSettings}
      </TabsContent>

      <TabsContent value="form" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-4 bg-muted rounded-lg">
          <div>
            <h3 className="text-lg font-medium">Share Your Booking Form</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Generate a unique link that clients can use to book appointments with you.
            </p>
          </div>
          {userId && <ShareFormButton userId={userId} />}
        </div>

        <div>
          <h3 className="text-lg font-medium">Form Customization</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Customize how your appointment booking form appears to clients.
          </p>
        </div>

        {formSettings}
      </TabsContent>

      <TabsContent value="appointment-types" className="space-y-6">
        {selectedAppointmentTypeId ? (
          <div className="space-y-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="mr-2"
                onClick={() => setSelectedAppointmentTypeId(null)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Types
              </Button>
            </div>
            <CustomFieldsManager appointmentTypeId={selectedAppointmentTypeId} />
          </div>
        ) : (
          <AppointmentTypes
            onSelectType={(typeId) => setSelectedAppointmentTypeId(typeId)}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
