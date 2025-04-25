// Service Worker for Web Push Notifications

// Cache name for the service worker
const CACHE_NAME = 'promptly-cache-v1';

// Listen for the install event
self.addEventListener('install', () => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Listen for the activate event
self.addEventListener('activate', () => {
  console.log('Service Worker activated');
  return self.clients.claim();
});

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('Push notification received', event);

  if (!event.data) {
    console.log('No payload');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Notification data:', data);

    const options = {
      body: data.body || 'New notification',
      icon: data.icon || '/logo.svg',
      badge: '/badge.svg',
      data: {
        url: data.url || '/dashboard/notifications',
      },
      actions: data.actions || [],
      tag: data.tag || 'default',
      renotify: data.renotify || false,
      requireInteraction: data.requireInteraction || false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Promptly Notification', options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Listen for notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);

  event.notification.close();

  // Get the notification data
  const url = event.notification.data?.url || '/dashboard/notifications';

  // Open the target URL
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window/tab is open with the target URL, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Listen for notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed', event);
});
