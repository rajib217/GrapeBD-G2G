// Firebase messaging service worker
// Use a newer compat release to stay compatible with modern Firebase SDKs.
// If you upgrade the firebase SDK in package.json, consider updating these importScripts versions accordingly.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

console.log('[Firebase SW] 🚀 Service worker script loaded');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrliuKAtFG0fHenlzFDeGKK8cyhEXfr8U",
  authDomain: "grapebd-g2gv2.firebaseapp.com",
  projectId: "grapebd-g2gv2",
  storageBucket: "grapebd-g2gv2.firebasestorage.app",
  messagingSenderId: "698951709124",
  appId: "1:698951709124:web:46eaf3ab51d6430148f491",
  measurementId: "G-ZGP4K7KWYX"
};

// Initialize Firebase inside a try/catch to surface issues in the worker
try {
  firebase.initializeApp(firebaseConfig);
  console.log('[Firebase SW] ✅ Firebase initialized');

  // Initialize Firebase Messaging
  const messaging = firebase.messaging();
  console.log('[Firebase SW] ✅ Messaging initialized');

  // Handle background messages
  messaging.onBackgroundMessage(function(payload) {
    console.log('[Firebase SW] 📨 Background message received:', payload);
    console.log('[Firebase SW] Notification:', payload.notification);
    console.log('[Firebase SW] Data:', payload.data);

    const notificationTitle = payload.notification?.title || 'নতুন বার্তা';
    const notificationOptions = {
      body: payload.notification?.body || 'আপনার জন্য নতুন বার্তা এসেছে',
      icon: '/pwa/manifest-icon-192.png',
      badge: '/pwa/manifest-icon-192.png',
      tag: payload.data?.tag || 'fcm-' + Date.now(),
      data: payload.data,
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'খুলুন'
        },
        {
          action: 'close',
          title: 'বন্ধ করুন'
        }
      ]
    };

    console.log('[Firebase SW] Showing notification:', notificationTitle, notificationOptions);
    return self.registration.showNotification(notificationTitle, notificationOptions);
  });

  // Handle notification click
  self.addEventListener('notificationclick', function(event) {
    console.log('Notification clicked:', event);

    event.notification.close();

    if (event.action === 'close') {
      return;
    }

    // Open the app when notification is clicked
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // If the app is already open, focus on it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          try {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          } catch (err) {
            // ignore cross-origin clients
          }
        }

        // If the app is not open, open it
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  });

  // Ensure the messaging SW activates promptly
  self.addEventListener('install', (e) => {
    self.skipWaiting();
  });
  self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
  });

  // Fallback: also listen for raw push events (data-only messages)
  // This helps when server sends data-only payloads that may not trigger
  // firebase.messaging() handlers depending on payload or SDK mismatch.
  self.addEventListener('push', function(event) {
    try {
      console.log('SW push event received:', event);
      if (event.data) {
        let payloadText = event.data.text();
        console.log('SW push payload text:', payloadText);
        let payload = null;
        try {
          payload = JSON.parse(payloadText);
        } catch (err) {
          // Not JSON — show raw text
        }

        const title = (payload && (payload.notification?.title || payload.title)) || 'নতুন বার্তা';
        const body = (payload && (payload.notification?.body || payload.body)) || payloadText || 'আপনার জন্য নতুন বার্তা এসেছে';

        const showOptions = {
          body,
          icon: '/pwa/manifest-icon-192.png',
          badge: '/pwa/manifest-icon-192.png',
          data: payload?.data || payload || null,
          tag: payload?.data?.tag || (payload && payload.tag) || 'push-message',
        };

        event.waitUntil(self.registration.showNotification(title, showOptions));
      } else {
        console.log('SW push event had no data');
      }
    } catch (err) {
      console.error('Error handling SW push event:', err);
    }
  });

} catch (err) {
  console.error('Error initializing firebase in messaging SW:', err);
}