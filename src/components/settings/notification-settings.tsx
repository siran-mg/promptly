"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellRing } from "lucide-react";
import { PushNotificationManager } from "@/components/notifications/push-notification-manager";

export function NotificationSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-indigo-600" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications on your device when you get new appointments (enabled by default).
            Note: Action buttons may not appear on all browsers and devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PushNotificationManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            More notification preferences will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
