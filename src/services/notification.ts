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

import { supabase } from '@/integrations/supabase/client';

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

    // Check if push is supported
    if (!registration.pushManager) {
      console.error('[Notification] Push notifications not supported');
      return false;
    }

    // Get existing subscription
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      await existingSubscription.unsubscribe();
      console.info('[Notification] Existing push subscription unsubscribed');
    }

    // Create new subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
    });
    if (!subscription) {
      console.error('[Notification] Failed to create push subscription');
      return false;
    }
    console.info('[Notification] Push notification subscription created:', subscription);
    return true;
  } catch (error) {
    console.error('[Notification] Error setting up push notifications:', error);
    return false;
  }
}
