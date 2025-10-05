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

    // Subscribe to realtime channels regardless of push setup; showNotification will no-op if permission is denied
    // This ensures in-app notifications work even if FCM token isn’t ready yet.


    // Subscribe to real-time notifications
    const messagesChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile.id}`,
        },
        async (payload) => {
          const { sender_id, content } = payload.new;
          console.info('[useNotifications] New message payload:', payload);
          // Fetch sender details
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', sender_id)
            .single();

          if (sender) {
            console.info('[useNotifications] Triggering showNotification for message:', sender.full_name, content);
            showNotification('নতুন মেসেজ', {
              body: `${sender.full_name}: ${content}`,
              tag: 'new-message'
            });
          } else {
            console.warn('[useNotifications] Sender not found for notification');
          }
        }
      )
      .subscribe();

    const giftsChannel = supabase
      .channel('gifts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gifts',
          filter: `receiver_id=eq.${profile.id}`,
        },
        async (payload) => {
          const { gift_name } = payload.new;
          console.info('[useNotifications] New gift payload:', payload);
          showNotification('নতুন গিফট!', {
            body: `আপনি গিফট পেয়েছেন!`,
            tag: 'new-gift'
          });
        }
      )
      .subscribe();

    return () => {
      messagesChannel.unsubscribe();
      giftsChannel.unsubscribe();
    };
  }, [profile?.id, notificationsEnabled]);

  return {
    notificationsEnabled,
    enableNotifications
  };
}