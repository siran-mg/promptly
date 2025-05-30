"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import {
  isPushNotificationSupported,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationsEnabled,
  getCurrentPushSubscription,
} from "@/lib/push-notifications";

export function PushNotificationManager() {
  const [supported, setSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const t = useTranslations();

  // Check if push notifications are supported and enabled
  useEffect(() => {
    const checkPushNotifications = async () => {
      try {
        // Set loading state
        setLoading(true);

        // Check if push notifications are supported
        const isSupported = isPushNotificationSupported();
        setSupported(isSupported);

        if (!isSupported) {
          // If not supported, exit early but make sure to set loading to false
          setLoading(false);
          return;
        }

        // Get current permission state
        setPermission(Notification.permission);

        // Check if notifications are already enabled
        const isEnabled = await isPushNotificationsEnabled();
        setEnabled(isEnabled);

        // If not enabled and permission is not denied, automatically enable
        if (!isEnabled && Notification.permission !== "denied") {
          try {
            // Register service worker
            const registration = await registerServiceWorker();
            if (!registration) {
              throw new Error("Failed to register service worker");
            }

            // Request permission
            const permission = await requestNotificationPermission();
            setPermission(permission);

            if (permission === "granted") {
              // Subscribe to push notifications
              const subscription = await subscribeToPushNotifications(registration);
              if (!subscription) {
                throw new Error("Failed to subscribe to push notifications");
              }

              // Save subscription to server
              const response = await fetch("/api/push/subscribe", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(subscription.toJSON()),
              });

              if (!response.ok) {
                throw new Error("Failed to save subscription to server");
              }

              setEnabled(true);
              toast({
                title: t('notifications.push.enabled'),
                description: t('notifications.push.enabledDescription'),
              });
            }
          } catch (error) {
            console.error("Error enabling push notifications:", error);
            // Don't show error toast for automatic enabling
          }
        }
      } catch (error) {
        console.error("Error in checkPushNotifications:", error);
      } finally {
        // Always set loading to false, even if there's an error
        setLoading(false);
      }
    };

    // Execute the function
    checkPushNotifications();
  }, [toast]);

  // Handle enabling push notifications
  const handleEnablePushNotifications = async () => {
    try {
      setLoading(true);

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error("Failed to register service worker");
      }

      // Request permission
      const permission = await requestNotificationPermission();
      setPermission(permission);

      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      // Subscribe to push notifications
      const subscription = await subscribeToPushNotifications(registration);
      if (!subscription) {
        throw new Error("Failed to subscribe to push notifications");
      }

      // Save subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription to server");
      }

      setEnabled(true);
      toast({
        title: t('notifications.push.enabled'),
        description: t('notifications.push.enabledDescription'),
      });
    } catch (error) {
      console.error("Error enabling push notifications:", error);
      toast({
        title: t('notifications.push.errorEnabling'),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle disabling push notifications
  const handleDisablePushNotifications = async () => {
    try {
      setLoading(true);

      // Get current subscription
      const subscription = await getCurrentPushSubscription();
      if (!subscription) {
        console.log("No active subscription found, considering notifications as disabled");
        setEnabled(false);
        toast({
          title: t('notifications.push.disabled'),
          description: t('notifications.push.disabledDescription'),
        });
        return;
      }

      // Store endpoint before unsubscribing
      const endpoint = subscription.endpoint;
      console.log("Found subscription with endpoint:", endpoint);

      // Unsubscribe from push notifications
      try {
        const registration = await navigator.serviceWorker.ready;
        const success = await unsubscribeFromPushNotifications(registration);

        if (!success) {
          console.warn("Failed to unsubscribe from push notifications client-side");
          // Continue anyway to try to remove from server
        } else {
          console.log("Successfully unsubscribed from push notifications client-side");
        }
      } catch (unsubError) {
        console.error("Error unsubscribing from push notifications client-side:", unsubError);
        // Continue anyway to try to remove from server
      }

      // Remove subscription from server
      try {
        console.log("Removing subscription from server with endpoint:", endpoint);
        const response = await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endpoint }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to remove subscription from server");
        }

        console.log("Successfully removed subscription from server");
      } catch (serverError) {
        console.error("Error removing subscription from server:", serverError);
        throw new Error("Failed to remove subscription from server");
      }

      setEnabled(false);
      toast({
        title: t('notifications.push.disabled'),
        description: t('notifications.push.disabledDescription'),
      });
    } catch (error) {
      console.error("Error disabling push notifications:", error);
      toast({
        title: t('notifications.push.errorDisabling'),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle
  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await handleEnablePushNotifications();
    } else {
      await handleDisablePushNotifications();
    }
  };

  // Add a timeout to ensure loading state doesn't get stuck
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 5000); // 5 second timeout

      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          <div className="text-xs sm:text-sm text-muted-foreground">
            {t('notifications.push.checking')}
          </div>
        </div>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="rounded-lg border p-3 sm:p-4 bg-amber-50 border-amber-200">
        <div className="flex items-center space-x-2">
          <BellOff className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-amber-700">
            {t('notifications.push.notSupported')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="push-notifications"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={loading || permission === "denied"}
        />
        <Label htmlFor="push-notifications" className="flex items-center gap-2 cursor-pointer">
          {enabled ? (
            <Bell className="h-4 w-4 text-indigo-600 flex-shrink-0" />
          ) : (
            <BellOff className="h-4 w-4 text-gray-500 flex-shrink-0" />
          )}
          <span className="text-sm">{t('notifications.push.title')}</span>
        </Label>
      </div>

      {permission === "denied" && (
        <div className="rounded-lg border p-3 sm:p-4 bg-amber-50 border-amber-200">
          <p className="text-xs sm:text-sm text-amber-700">
            {t('notifications.push.permissionDenied')}
          </p>
        </div>
      )}

      <p className="text-xs sm:text-sm text-muted-foreground">
        {enabled
          ? t('notifications.push.enabledInfo')
          : t('notifications.push.defaultInfo')}
      </p>
    </div>
  );
}
