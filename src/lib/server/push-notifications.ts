import webpush from 'web-push';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:contact@promptly.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

/**
 * Send a push notification to a subscription
 */
export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    tag?: string;
    actions?: Array<{ action: string; title: string }>;
    renotify?: boolean;
    requireInteraction?: boolean;
  }
): Promise<{ success: boolean; error?: any }> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error };
  }
}

/**
 * Send push notifications to multiple subscriptions
 */
export async function sendPushNotifications(
  subscriptions: webpush.PushSubscription[],
  payload: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    tag?: string;
    actions?: Array<{ action: string; title: string }>;
    renotify?: boolean;
    requireInteraction?: boolean;
  }
): Promise<{ success: boolean; results: Array<{ success: boolean; error?: any }> }> {
  const results = await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        return { success: true };
      } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error };
      }
    })
  );

  const allSuccessful = results.every((result) => result.success);
  return { success: allSuccessful, results };
}
