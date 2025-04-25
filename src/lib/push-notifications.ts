// Utility functions for web push notifications

/**
 * Convert a base64 string to a Uint8Array for the applicationServerKey
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the browser supports push notifications
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) {
    console.log('Push notifications not supported');
    return null;
  }

  try {
    // Check if service worker is already registered
    const existingRegistration = await navigator.serviceWorker.getRegistration('/service-worker.js');
    if (existingRegistration) {
      console.log('Service Worker already registered with scope:', existingRegistration.scope);
      return existingRegistration;
    }

    // Register new service worker
    console.log('Registering service worker...');
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered with scope:', registration.scope);

    // Wait for the service worker to be ready
    if (registration.installing) {
      console.log('Service worker installing...');

      // Return a promise that resolves when the service worker is activated
      return new Promise((resolve) => {
        registration.installing?.addEventListener('statechange', (event) => {
          if ((event.target as ServiceWorker).state === 'activated') {
            console.log('Service worker activated');
            resolve(registration);
          }
        });
      });
    }

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Request permission for push notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      console.error('VAPID public key not found');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('Push notification subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return false;
    }

    const result = await subscription.unsubscribe();
    return result;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

/**
 * Get the current push notification subscription
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    // Check if service worker is registered and ready
    if (navigator.serviceWorker.controller === null) {
      console.log('Service worker not controlling the page yet');

      // Try to get the registration
      const registration = await navigator.serviceWorker.getRegistration('/service-worker.js');
      if (!registration) {
        console.log('No service worker registration found');
        return null;
      }

      const subscription = await registration.pushManager.getSubscription();
      return subscription;
    }

    // Normal path when service worker is ready
    const registration = await navigator.serviceWorker.ready;
    console.log('Service worker ready, getting subscription');
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('Found existing push subscription');
    } else {
      console.log('No push subscription found');
    }

    return subscription;
  } catch (error) {
    console.error('Error getting current push subscription:', error);
    return null;
  }
}

/**
 * Check if push notifications are enabled
 */
export async function isPushNotificationsEnabled(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    console.log('Push notifications not supported by browser');
    return false;
  }

  try {
    // Check permission first
    const permission = Notification.permission;
    console.log('Notification permission status:', permission);

    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    // Check for service worker registration
    const registration = await navigator.serviceWorker.getRegistration('/service-worker.js');
    if (!registration) {
      console.log('No service worker registration found');
      return false;
    }

    // Check for push subscription
    const subscription = await registration.pushManager.getSubscription();
    const isEnabled = !!subscription;

    console.log('Push subscription found:', isEnabled);
    return isEnabled;
  } catch (error) {
    console.error('Error checking if push notifications are enabled:', error);
    return false;
  }
}
