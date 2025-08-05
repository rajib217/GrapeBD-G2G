importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

workbox.setConfig({
  debug: false
});

const {registerRoute} = workbox.routing;
const {CacheFirst, NetworkFirst, StaleWhileRevalidate} = workbox.strategies;
const {CacheableResponse} = workbox.cacheableResponse;
const {ExpirationPlugin} = workbox.expiration;

// Initialize push notifications
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Enable navigation preload if available
      self.registration.navigationPreload && self.registration.navigationPreload.enable(),
      // Subscribe to push notifications if available
      self.registration.pushManager && self.registration.pushManager.getSubscription().then(subscription => {
        if (!subscription) {
          console.log('Push notifications not subscribed');
        }
      })
    ])
  );
});

// Cache page navigations (html) with a Network First strategy
registerRoute(
  ({request}) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new CacheableResponse({
        statuses: [200]
      })
    ]
  })
);

// Cache Google Fonts
registerRoute(
  ({url}) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets'
  })
);

registerRoute(
  ({url}) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponse({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30
      })
    ]
  })
);

// Cache images
registerRoute(
  ({request}) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Cache API requests
registerRoute(
  ({url}) => url.origin.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 // 1 hour
      })
    ]
  })
);

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Offline fallback
const FALLBACK_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>অফলাইন - GrapeBD</title>
    <style>
        body {
            font-family: 'Noto Sans Bengali', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f9fafb;
        }
        .offline-message {
            text-align: center;
            padding: 2rem;
        }
        .offline-message h1 {
            color: #1d4ed8;
            margin-bottom: 1rem;
        }
        .offline-message p {
            color: #4b5563;
        }
    </style>
</head>
<body>
    <div class="offline-message">
        <h1>আপনি অফলাইনে আছেন</h1>
        <p>অনুগ্রহ করে ইন্টারনেট কানেকশন চেক করুন।</p>
    </div>
</body>
</html>
`;

// Serve offline page when no cache is available
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(FALLBACK_HTML, {
          headers: {'Content-Type': 'text/html'}
        });
      })
    );
  }
});
