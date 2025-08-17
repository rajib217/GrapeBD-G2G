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

    // For basic notifications, we don't need push manager subscription
    // Just return true if notification permission is granted
    if (Notification.permission === 'granted') {
      console.info('[Notification] Basic notifications enabled without push subscription');
      return true;
    }

    console.warn('[Notification] Notification permission not granted');
    return false;
  } catch (error) {
    console.error('[Notification] Error setting up notifications:', error);
    return false;
  }
}
