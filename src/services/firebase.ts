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
  } catch (error) {
    console.error('Firebase messaging initialization failed:', error);
  }
}

// VAPID key from Firebase Console
const VAPID_KEY = 'BHOcfClbpLGoR2iejzJBPrBoChOvTmZVrxBJZR4qBJrZ0HoYWcifnM7lJHk9gPp8GypASgIgO9ORV6SXiq-iA-M';

export async function generateFCMToken() {
  if (!messaging) {
    console.error('Firebase messaging not initialized');
    return null;
  }

  try {
    // Prefer an explicit service worker registration for messaging.
    // This ensures the FCM token is associated with the correct SW (firebase-messaging-sw.js).
    let swRegistration: ServiceWorkerRegistration | undefined;
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        // Try to get the registration for the firebase messaging SW first
        swRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js') || (await navigator.serviceWorker.ready);
      } catch (swErr) {
        // navigator.serviceWorker.getRegistration may throw in some contexts; fall back to ready
        try {
          swRegistration = await navigator.serviceWorker.ready;
        } catch {
          swRegistration = undefined;
        }
      }
    }

    console.info('[firebase] serviceWorkerRegistration for getToken:', swRegistration && {
      scope: swRegistration.scope,
      activeScript: swRegistration.active && swRegistration.active.scriptURL
    });

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      // Only pass the registration if available; Firebase will use the default otherwise.
      serviceWorkerRegistration: swRegistration as any
    });

    if (token) {
      console.log('FCM Token generated:', token);
      return token;
    } else {
      console.log('No registration token available.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) {
    console.error('Firebase messaging not initialized');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
}

export { messaging };