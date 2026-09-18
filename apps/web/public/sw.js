// PROKAP OMS 360 - Service Worker for Device & Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { message: event.data.text() };
    }
  }

  const title = data.title || (data.notification && data.notification.title) || 'PROKAP OMS 360 Alert';
  const body = data.body || data.message || (data.notification && data.notification.body) || 'New order status notification';
  
  const options = {
    body: body,
    icon: '/prokap-badge.png',
    badge: '/favicon-32x32.png',
    vibrate: [250, 100, 250, 100, 250],
    tag: 'prokap-alert-' + (data.order_id || Date.now()),
    renotify: true,
    data: {
      url: '/',
      order_id: data.order_id,
      timestamp: Date.now()
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
