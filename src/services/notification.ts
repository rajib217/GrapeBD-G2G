export function hasRejectedNotifications() {
  return localStorage.getItem('notificationRejected') === 'true';
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
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
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export async function showNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/pwa/manifest-icon-192.png',
        badge: '/pwa/manifest-icon-192.png',
        ...options
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
}

export async function setupPushNotifications(userId: string) {
  try {
    // Check if service worker is ready
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker not supported');
      return false;
    }

    // Wait for service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Check if push is supported
    if (!registration.pushManager) {
      console.error('Push notifications not supported');
      return false;
    }

    // Get existing subscription
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      await existingSubscription.unsubscribe();
    }

    // Create new subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
    });

    // Store subscription in Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert([
        {
          user_id: userId,
          subscription: JSON.stringify(subscription),
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error setting up push notifications:', error);
    return false;
  }
}
