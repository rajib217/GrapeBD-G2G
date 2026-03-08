import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { requestNotificationPermission, showNotification, setupPushNotifications } from '@/services/notification';
import { supabase } from '@/integrations/supabase/client';

export function useNotifications() {
  const { profile } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if ('Notification' in window) {
        setNotificationsEnabled(Notification.permission === 'granted');
      }
    };

    checkPermission();
  }, []);

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    // Pass the auth user's id (profile.user_id) — the fcm_tokens RLS policy expects auth.uid() = user_id
    const authUserId = profile?.user_id ?? profile?.id;
    if (granted && authUserId) {
      const success = await setupPushNotifications(authUserId);
      setNotificationsEnabled(success);
    }
  };

  useEffect(() => {
    // Diagnostic logging to help debug why subscription is skipped
    console.info('[useNotifications] Check subscription conditions:', {
      profileId: profile?.id,
      notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
      notificationsEnabled
    });

    if (!profile?.id) {
      console.info('[useNotifications] No profile yet, skipping subscription');
      return;
    }

    // If permission already granted, ensure we have a push subscription / FCM token
    const tryEnableAndSubscribe = async () => {
      try {
        if (typeof Notification === 'undefined') {
          console.warn('[useNotifications] Notifications unsupported in this environment');
          return;
        }

        if (Notification.permission === 'granted') {
          if (!notificationsEnabled) {
            console.info('[useNotifications] Permission granted — setting up push notifications');
            // Use the auth user id (profile.user_id) for backend upsert to satisfy RLS policies
            const authUserId = profile.user_id ?? profile.id;
            const success = await setupPushNotifications(authUserId);
            setNotificationsEnabled(success);
          }
        } else if (Notification.permission === 'default') {
          // Ask once if the user hasn't previously rejected
          const previouslyRejected = localStorage.getItem('notificationRejected') === 'true';
          if (!previouslyRejected) {
            console.info('[useNotifications] Prompting user for notification permission');
            await enableNotifications();
          } else {
            console.info('[useNotifications] User previously rejected notifications');
          }
        } else {
          console.info('[useNotifications] Notification permission denied');
        }
      } catch (err) {
        console.error('[useNotifications] Error while enabling notifications:', err);
      }
    };

    void tryEnableAndSubscribe();

    // Subscribe to real-time notifications for gifts only
    // Note: Message notifications are handled by Messages.tsx component to avoid duplicates
    const giftsChannel = supabase
      .channel('gifts-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gifts',
          filter: `receiver_id=eq.${profile.id}`,
        },
        async (payload) => {
          console.info('[useNotifications] New gift payload:', payload);
          showNotification('নতুন গিফট!', {
            body: 'আপনি গিফট পেয়েছেন!',
            tag: 'new-gift'
          });
        }
      )
      .subscribe();

    return () => {
      giftsChannel.unsubscribe();
    };
  }, [profile?.id, notificationsEnabled]);

  return {
    notificationsEnabled,
    enableNotifications
  };
}
