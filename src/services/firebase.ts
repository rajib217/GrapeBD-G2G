import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
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