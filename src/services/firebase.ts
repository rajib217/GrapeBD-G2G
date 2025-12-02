import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
const app = initializeApp(firebaseConfig);

// Initialize Firebase Messaging
let messaging: any = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
    console.log('[Firebase] ✅ Messaging initialized successfully');
  } catch (error) {
    console.error('[Firebase] ❌ Messaging initialization failed:', error);
  }
}

// VAPID key from Firebase Console
const VAPID_KEY = 'BLOSesp2v-l2UwNR5K_iaGJFL624uDecutcP0gFZdlGYVnXqiq1FzBpYk__dpijATSM1oeuGRj8lyUmZDu5nZmM';

export async function generateFCMToken() {
  console.log('[FCM] 🚀 generateFCMToken called');
  
  if (!messaging) {
    console.error('[FCM] ❌ Firebase messaging not initialized');
    return null;
  }

  console.log('[FCM] ✅ Firebase messaging is initialized');

  try {
    // Prefer an explicit service worker registration for messaging.
    // This ensures the FCM token is associated with the correct SW (firebase-messaging-sw.js).
    let swRegistration: ServiceWorkerRegistration | undefined;
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      console.log('[FCM] 🔍 Looking for service worker registration...');
      try {
        // Try to get the registration for the firebase messaging SW first
        swRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js') || (await navigator.serviceWorker.ready);
        console.log('[FCM] ✅ Service worker registration found');
      } catch (swErr) {
        console.warn('[FCM] ⚠️ Error getting specific SW registration, falling back to ready:', swErr);
        // navigator.serviceWorker.getRegistration may throw in some contexts; fall back to ready
        try {
          swRegistration = await navigator.serviceWorker.ready;
          console.log('[FCM] ✅ Fallback service worker ready');
        } catch {
          console.error('[FCM] ❌ No service worker available');
          swRegistration = undefined;
        }
      }
    }

    console.info('[FCM] 📋 Service worker details:', swRegistration && {
      scope: swRegistration.scope,
      activeScript: swRegistration.active && swRegistration.active.scriptURL
    });

    console.log('[FCM] 🔑 Requesting token with VAPID key...');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      // Only pass the registration if available; Firebase will use the default otherwise.
      serviceWorkerRegistration: swRegistration as any
    });

    if (token) {
      console.log('[FCM] ✅ Token generated successfully:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('[FCM] ⚠️ No registration token available. Possible reasons:');
      console.warn('  - User may have denied notification permission');
      console.warn('  - Service worker may not be properly registered');
      console.warn('  - VAPID key may be incorrect');
      return null;
    }
  } catch (error) {
    console.error('[FCM] ❌ Error occurred while retrieving token:', error);
    if (error instanceof Error) {
      console.error('[FCM] Error message:', error.message);
      console.error('[FCM] Error stack:', error.stack);
    }
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) {
    console.error('[FCM] Firebase messaging not initialized');
    return () => {};
  }

  console.log('[FCM] 📱 Setting up onMessage listener...');
  
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('[FCM] 📨 Foreground message received:', payload);
    console.log('[FCM] Notification data:', payload.notification);
    console.log('[FCM] Custom data:', payload.data);
    callback(payload);
  });

  console.log('[FCM] ✅ onMessage listener attached');
  return unsubscribe;
}

export { messaging };
