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
    if (granted && profile?.id) {
      const success = await setupPushNotifications(profile.id);
      setNotificationsEnabled(success);
    }
  };

  useEffect(() => {
    if (!profile?.id || !notificationsEnabled) return;

    // Subscribe to real-time notifications
    const messagesChannel = supabase
      .channel('messages')
      .on(
  useEffect(() => {
    if (!profile?.id || !notificationsEnabled) {
      console.info('[useNotifications] Skipping subscription: profile or notifications not enabled');
      return;
    }

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
            showNotification('\u09a8\u09a4\u09c1\u09a8 \u09ae\u09c7\u09b8\u09c7\u099c', {
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
          showNotification('\u09a8\u09a4\u09c1\u09a8 \u0997\u09bf\u09ab\u099f!', {
            body: `\u0986\u09aa\u09a8\u09bf \u0997\u09bf\u09ab\u099f \u09aa\u09c7\u09af\u09bc\u09c7\u099b\u09c7\u09a8!`,
            tag: 'new-gift'
          });
        }
      )
      .subscribe();
  }, [profile?.id, notificationsEnabled]);
          table: 'gift_assignments',
          filter: `receiver_id=eq.${profile.id}`,
        },
        async (payload) => {
          const { gift_name } = payload.new;
          
          showNotification('গিফট এসাইনমেন্ট', {
            body: `আপনাকে গিফট এসাইন করা হয়েছে।`,
            tag: 'gift-assignment'
          });
        }
      )
      .subscribe();

    return () => {
      messagesChannel.unsubscribe();
      giftsChannel.unsubscribe();
      assignmentsChannel.unsubscribe();
    };
  }, [profile?.id, notificationsEnabled]);

  return {
    notificationsEnabled,
    enableNotifications
  };
}
