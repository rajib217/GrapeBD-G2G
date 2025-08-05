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
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile.id}`,
        },
        async (payload) => {
          const { sender_id, content } = payload.new;
          
          // Fetch sender details
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', sender_id)
            .single();

          if (sender) {
            showNotification('নতুন মেসেজ', {
              body: `${sender.full_name}: ${content}`,
              tag: 'new-message',
              renotify: true
            });
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
          
          showNotification('নতুন গিফট!', {
            body: `আপনি ${gift_name} গিফট পেয়েছেন!`,
            tag: 'new-gift',
            renotify: true
          });
        }
      )
      .subscribe();

    const assignmentsChannel = supabase
      .channel('gift_assignments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gift_assignments',
          filter: `receiver_id=eq.${profile.id}`,
        },
        async (payload) => {
          const { gift_name } = payload.new;
          
          showNotification('গিফট এসাইনমেন্ট', {
            body: `আপনাকে ${gift_name} গিফট এসাইন করা হয়েছে।`,
            tag: 'gift-assignment',
            renotify: true
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
