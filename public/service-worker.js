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

    // Log the actions to help debug
    console.log('Notification actions:', data.actions);

    const options = {
      body: data.body || 'New notification',
      icon: data.icon || '/logo.svg',
      badge: '/badge.svg',
      data: {
        url: data.url || '/dashboard/notifications',
        ...(data.data || {}), // Include any additional data
      },
      // Ensure actions are properly formatted
      actions: Array.isArray(data.actions) ? data.actions.map(action => ({
        action: action.action,
        title: action.title
      })) : [],
      tag: data.tag || 'default',
      renotify: data.renotify || true, // Set to true to ensure notification is shown even if tag is the same
      requireInteraction: true, // Force this to true to ensure buttons are visible
      silent: false, // Ensure notification makes sound
      vibrate: [100, 50, 100, 50, 100], // More noticeable vibration pattern
    };

    // Log the final notification options for debugging
    console.log('Final notification options:', options);

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(data.title || 'Promptly Notification', options)
        .then(() => {
          console.log('Notification shown successfully');
        })
        .catch(error => {
          console.error('Error showing notification:', error);
        })
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Listen for notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);

  // Close the notification
  event.notification.close();

  // Get the notification data
  const notificationData = event.notification.data || {};
  let url = notificationData.url || '/dashboard/notifications';

  // Log the action for debugging
  console.log('Notification action:', event.action);

  // Handle different actions
  if (event.action === 'view') {
    // View appointment action - go to appointment details
    if (notificationData.appointmentId) {
      url = `/dashboard/appointments?appointmentId=${notificationData.appointmentId}`;
    }
  } else if (event.action === 'markAsRead') {
    // Mark as read action - just close the notification and mark it as read
    // We'll make a request to mark the notification as read
    if (notificationData.appointmentId) {
      console.log('Marking notification as read:', notificationData.notificationId || notificationData.appointmentId);

      // Create a background sync to mark the notification as read
      fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: notificationData.appointmentId,
          notificationId: notificationData.notificationId
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Mark as read response:', data);
      })
      .catch(err => console.error('Error marking notification as read:', err));

      // Don't navigate anywhere for this action
      return;
    }
  } else if (!event.action) {
    // Default action (notification body was clicked)
    // If we have an appointment ID, go to the appointment details
    if (notificationData.appointmentId) {
      url = `/dashboard/appointments?appointmentId=${notificationData.appointmentId}`;
    }
  }

  // Log the action and URL
  console.log(`Action: ${event.action || 'default'}, navigating to: ${url}`);

  // Open the target URL
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
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
