// Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'নতুন বার্তা';
  const notificationOptions = {
    body: payload.notification?.body || 'আপনার জন্য নতুন বার্তা এসেছে',
    icon: '/pwa/manifest-icon-192.png',
    badge: '/pwa/manifest-icon-192.png',
    tag: payload.data?.tag || 'default',
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
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If the app is not open, open it
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});