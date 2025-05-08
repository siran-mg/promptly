"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellRing, MessageSquare } from "lucide-react";
import { PushNotificationManager } from "@/components/notifications/push-notification-manager";
import { SmsNotificationManager } from "@/components/notifications/sms-notification-manager";
import { useTranslations } from "next-intl";

export function NotificationSettings() {
  const t = useTranslations();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-indigo-600" />
            {t('settings.notificationSettings.pushNotifications')}
          </CardTitle>
          <CardDescription>
            {t('settings.notificationSettings.pushNotificationsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PushNotificationManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            {t('settings.notificationSettings.sms')}
          </CardTitle>
          <CardDescription>
            {t('settings.notificationSettings.smsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SmsNotificationManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            {t('settings.notificationSettings.preferences')}
          </CardTitle>
          <CardDescription>
            {t('settings.notificationSettings.preferencesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('settings.notificationSettings.comingSoon')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
