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
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { generateFCMToken, onForegroundMessage } from './firebase';

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
      // Generate FCM token
      const token = await generateFCMToken();
      
      if (token) {
        console.info('[Notification] FCM Token received:', token);
        
        // Send token to your backend
        await saveTokenToBackend(token, userId);
        
        // Set up foreground message listener
        onForegroundMessage((payload) => {
          const { notification, data } = payload;
          if (notification) {
            showNotification(notification.title, {
              body: notification.body,
              tag: data?.tag || 'fcm-message',
              data: data
            });
          }
        });
        
        return true;
      }
    }

    console.warn('[Notification] Notification permission not granted');
    return false;
  } catch (error) {
    console.error('[Notification] Error setting up notifications:', error);
    return false;
  }
}

// Function to save the FCM token to your backend (Supabase)
async function saveTokenToBackend(token: string, userId: string) {
    try {
        // Save FCM token to Supabase database
        // Use onConflict for the composite unique constraint (user_id, token)
        const { error } = await supabase
          .from('fcm_tokens')
          .upsert({ 
            user_id: userId, 
            token: token,
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              timestamp: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,token' });

        if (error) {
          // Handle duplicate key (token already present) as a success case
          console.error('[Notification] Error saving token to database:', error);
          if (error.code === '23505') {
            console.warn('[Notification] Token already exists in database (duplicate). Treating as success.');
            return true;
          }

          // PostgREST / Supabase client returns `code` on permission errors (e.g. '42501')
          if (error.code === '42501' || (typeof error.message === 'string' && error.message.toLowerCase().includes('row-level security'))) {
            console.warn('[Notification] Likely RLS permission error. Ensure the client is authenticated and the provided user id matches auth.uid().');
          }

          // If it's an RLS/permission error, try server-side upsert via Edge Function
          if (error.code === '42501' || (typeof error.message === 'string' && error.message.toLowerCase().includes('row-level security'))) {
            try {
              const session = await supabase.auth.getSession();
              const accessToken = session.data?.session?.access_token;
              const endpoint = `${SUPABASE_URL}/functions/v1/save-fcm-token`;
              const resp = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
                },
                body: JSON.stringify({ token, user_id: userId })
              });

              if (resp.ok) {
                console.info('[Notification] Fallback save to Edge Function succeeded');
                return true;
              } else {
                const errText = await resp.text();
                console.error('[Notification] Edge Function save failed:', resp.status, errText);
              }
            } catch (fnErr) {
              console.error('[Notification] Edge Function fallback error:', fnErr);
            }
          }

          // Fallback to localStorage using the provided auth user id
          localStorage.setItem(`fcm_token_${userId}`, token);
          return false;
        }
        
        console.info('[Notification] FCM Token saved to database:', token);
        return true;
    } catch (error) {
        console.error('[Notification] Error in saveTokenToBackend:', error);
        // Fallback to localStorage using the provided auth user id
        try {
          localStorage.setItem(`fcm_token_${userId}`, token);
        } catch (e) {
          console.warn('[Notification] Could not write fallback token to localStorage:', e);
        }
        return false;
    }
}
