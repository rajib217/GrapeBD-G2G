export function hasRejectedNotifications() {
  return localStorage.getItem('notificationRejected') === 'true';
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (hasRejectedNotifications()) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('notificationGranted', 'true');
      localStorage.removeItem('notificationRejected');
      return true;
    } else if (permission === 'denied') {
      localStorage.setItem('notificationRejected', 'true');
      localStorage.removeItem('notificationGranted');
    }
    return false;
  } catch (error) {
    return false;
  }
}

export async function showNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        return;
      }
      await registration.showNotification(title, {
        icon: '/pwa/manifest-icon-192.png',
        badge: '/pwa/manifest-icon-192.png',
        ...options
      });
    } catch (error) {
      // Handle notification error silently
    }
  }
}

import { supabase } from '@/integrations/supabase/client';

export async function setupPushNotifications(userId: string) {
  try {
    // Check if service worker is ready
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    // Wait for service worker registration
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      return false;
    }

    // For basic notifications, we don't need push manager subscription
    // Just return true if notification permission is granted
    if (Notification.permission === 'granted') {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}