"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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
                title: "Push notifications enabled",
                description: "You will now receive push notifications for new appointments.",
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
        title: "Push notifications enabled",
        description: "You will now receive push notifications for new appointments.",
      });
    } catch (error) {
      console.error("Error enabling push notifications:", error);
      toast({
        title: "Error enabling push notifications",
        description: error instanceof Error ? error.message : "An unknown error occurred",
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
          title: "Push notifications disabled",
          description: "You will no longer receive push notifications.",
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
        title: "Push notifications disabled",
        description: "You will no longer receive push notifications.",
      });
    } catch (error) {
      console.error("Error disabling push notifications:", error);
      toast({
        title: "Error disabling push notifications",
        description: error instanceof Error ? error.message : "An unknown error occurred",
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
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          <div className="text-sm text-muted-foreground">
            Checking notification settings...
          </div>
        </div>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="rounded-lg border p-4 bg-amber-50 border-amber-200">
        <div className="flex items-center space-x-2">
          <BellOff className="h-5 w-5 text-amber-500" />
          <p className="text-sm text-amber-700">
            Push notifications are not supported in your browser.
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
        <Label htmlFor="push-notifications" className="flex items-center gap-2">
          {enabled ? (
            <Bell className="h-4 w-4 text-indigo-600" />
          ) : (
            <BellOff className="h-4 w-4 text-gray-500" />
          )}
          Push Notifications
        </Label>
      </div>

      {permission === "denied" && (
        <div className="rounded-lg border p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-700">
            Notification permission has been denied. Please enable notifications in your browser
            settings to receive push notifications.
          </p>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {enabled
          ? "You will receive push notifications for new appointments and important updates."
          : "Push notifications are enabled by default. Toggle this switch to manage your notification preferences."}
      </p>
    </div>
  );
}
