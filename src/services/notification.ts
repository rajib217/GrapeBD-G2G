export function hasRejectedNotifications() {
  return localStorage.getItem('notificationRejected') === 'true';
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.error('[Notification] This browser does not support notifications');
    return false;
  }
  
  if (hasRejectedNotifications()) {
    console.warn('[Notification] User has previously rejected notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.info('[Notification] Permission result:', permission);
    if (permission === 'granted') {
      localStorage.setItem('notificationGranted', 'true');
      localStorage.removeItem('notificationRejected');
      return true;
    } else if (permission === 'denied') {
      localStorage.setItem('notificationRejected', 'true');
      localStorage.removeItem('notificationGranted');
      console.warn('[Notification] Permission denied by user');
    }
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export async function showNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    console.error('[Notification] This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        console.error('[Notification] Service worker registration not found');
        return;
      }
      await registration.showNotification(title, {
        icon: '/pwa/manifest-icon-192.png',
        badge: '/pwa/manifest-icon-192.png',
        ...options
      });
      console.info('[Notification] Notification shown:', title, options);
    } catch (error) {
      console.error('[Notification] Error showing notification:', error);
    }
  } else {
    console.warn('[Notification] Notification permission not granted');
  }
}

// Helper function to convert VAPID public key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
import { supabase } from '@/integrations/supabase/client';
const VAPID_PUBLIC_KEY = 'BHOcfClbpLGoR2iejzJBPrBoChOvTmZVrxBJZR4qBJrZ0HoYWcifnM7lJHk9gPp8GypASgIgO9ORV6SXiq-iA-M';
export async function setupPushNotifications(userId: string) {
  try {
    // Check if service worker is ready
    if (!('serviceWorker' in navigator)) {
      console.error('[Notification] Service Worker not supported');
      return false;
    }

    // Wait for service worker registration
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.error('[Notification] Service worker registration not found');
      return false;
    }

    if (Notification.permission === 'granted') {
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
          console.info('[Notification] Already subscribed', existingSubscription);
          // Optionally, send existing subscription to backend if not already saved
          return true;
      }

      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      };

      const subscription = await registration.pushManager.subscribe(subscribeOptions);

      console.info('[Notification] Push subscribed:', subscription);

      // Send subscription to your backend
      await saveSubscriptionToBackend(subscription, userId);
      return true;
    }

    console.warn('[Notification] Notification permission not granted');
    return false;
  } catch (error) {
    console.error('[Notification] Error setting up notifications:', error);
    return false;
  }
}

// Function to save the subscription to your backend (Supabase)
async function saveSubscriptionToBackend(subscription: PushSubscription, userId: string) {
    // Convert PushSubscription object to a plain object
    const subscriptionData = subscription.toJSON();

    try {
        // Replace 'user_push_subscriptions' with your actual Supabase table name if you used a different one
        const { data, error } = await supabase
            .from('user_push_subscriptions')
            .insert([
                {
                    user_id: userId,
                    endpoint: subscriptionData.endpoint,
                    p256dh: subscriptionData.keys?.p256dh,
                    auth: subscriptionData.keys?.auth,
                },
            ]);

        if (error) {
            console.error('[Notification] Error saving subscription to Supabase:', error);
            return false;
        }

        console.info('[Notification] Subscription saved to Supabase:', data);
        return true;

    } catch (error) {
        console.error('[Notification] Error in saveSubscriptionToBackend:', error);
        return false;
    }
}
