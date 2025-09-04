// Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAI1JBYRF4hZZOmwdSk5QKraGQ_zxqWPZI",
  authDomain: "grape-bd-g2g.firebaseapp.com",
  projectId: "grape-bd-g2g",
  storageBucket: "grape-bd-g2g.firebasestorage.app",
  messagingSenderId: "95985049833",
  appId: "1:95985049833:web:2e1b9b0d993fd04b855078"
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