import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Send, Bell } from 'lucide-react';
import { generateFCMToken } from '@/services/firebase';
import { setupPushNotifications } from '@/services/notification';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function FCMDebugPanel() {
  const { profile } = useAuth();
  const [status, setStatus] = useState({
    notificationPermission: 'checking...',
    serviceWorkerReady: false,
    firebaseInitialized: false,
    fcmToken: null as string | null,
    error: null as string | null,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const checkStatus = async () => {
    console.log('[FCM Debug] 🔍 Starting status check...');
    
    const newStatus = {
      notificationPermission: 'Notification' in window ? Notification.permission : 'not-supported',
      serviceWorkerReady: false,
      firebaseInitialized: false,
      fcmToken: null as string | null,
      error: null as string | null,
    };

    try {
      // Check service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        newStatus.serviceWorkerReady = !!registration;
        console.log('[FCM Debug] ✅ Service worker ready:', registration.scope);
      }

      // Check if Firebase is initialized
      try {
        const { messaging } = await import('@/services/firebase');
        newStatus.firebaseInitialized = !!messaging;
        console.log('[FCM Debug] Firebase messaging initialized:', !!messaging);
      } catch (err) {
        console.error('[FCM Debug] ❌ Firebase import error:', err);
        newStatus.error = 'Firebase initialization failed';
      }

      // Check for existing FCM token in localStorage
      // Use profile.user_id (auth user id) which matches the key used when saving
      if (profile?.user_id) {
        const storedToken = localStorage.getItem(`fcm_token_${profile.user_id}`);
        if (storedToken) {
          newStatus.fcmToken = storedToken;
          console.log('[FCM Debug] 📦 Found stored token');
        }
      }

      // Also check DB for tokens
      if (profile?.user_id) {
        try {
          const { data, error } = await supabase
            .from('fcm_tokens')
            .select('token')
            .eq('user_id', profile.user_id)
            .limit(1);
          if (!error && data && data.length > 0) {
            newStatus.fcmToken = data[0].token;
            console.log('[FCM Debug] 📦 Found DB token');
          }
        } catch (e) {
          console.warn('[FCM Debug] DB token check failed:', e);
        }
      }
    } catch (err) {
      console.error('[FCM Debug] ❌ Status check error:', err);
      newStatus.error = err instanceof Error ? err.message : 'Unknown error';
    }

    setStatus(newStatus);
  };

  useEffect(() => {
    checkStatus();
  }, [profile?.id]);

  const handleGenerateToken = async () => {
    if (!profile?.user_id) {
      alert('User profile not loaded');
      return;
    }

    setIsGenerating(true);
    console.log('[FCM Debug] 🚀 Manual token generation started...');

    try {
      // First check permission
      if (Notification.permission !== 'granted') {
        console.log('[FCM Debug] ⚠️ Requesting notification permission...');
        const permission = await Notification.requestPermission();
        console.log('[FCM Debug] Permission result:', permission);
        
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      // Generate token
      console.log('[FCM Debug] 📝 Generating FCM token...');
      const token = await generateFCMToken();
      
      if (token) {
        console.log('[FCM Debug] ✅ Token generated:', token.substring(0, 30) + '...');
        
        // Setup push notifications - Use profile.user_id (auth user id) instead of profile.id
        console.log('[FCM Debug] 📲 Setting up push notifications with user_id:', profile.user_id);
        await setupPushNotifications(profile.user_id);
        
        // Refresh status
        await checkStatus();
        alert('FCM Token তৈরি সফল হয়েছে! ✅');
      } else {
        throw new Error('Token generation returned null');
      }
    } catch (err) {
      console.error('[FCM Debug] ❌ Error:', err);
      setStatus(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error'
      }));
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetAllTokens = async () => {
    if (!profile?.user_id) {
      alert('User profile not loaded');
      return;
    }

    if (!confirm('⚠️ সব পুরোনো FCM টোকেন মুছে ফেলতে চান? এরপর নতুন টোকেন তৈরি করতে হবে।')) {
      return;
    }

    try {
      console.log('[FCM Debug] 🗑️ Deleting all FCM tokens for user...');
      
      const { error } = await supabase
        .from('fcm_tokens')
        .delete()
        .eq('user_id', profile.user_id);

      if (error) {
        console.error('[FCM Debug] ❌ Delete error:', error);
        alert('Error: ' + error.message);
      } else {
        console.log('[FCM Debug] ✅ All tokens deleted');
        
        // Clear localStorage
        localStorage.removeItem(`fcm_token_${profile.user_id}`);
        
        // Refresh status
        await checkStatus();
        alert('✅ সব টোকেন মুছে ফেলা হয়েছে!\nএখন "FCM Token তৈরি করুন" বাটনে ক্লিক করুন।');
      }
    } catch (err) {
      console.error('[FCM Debug] ❌ Error deleting tokens:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleSendTestNotification = async (isBackground = false) => {
    if (!profile?.user_id) {
      alert('User profile not loaded');
      return;
    }

    try {
      if (isBackground) {
        alert('⚠️ ব্যাকগ্রাউন্ড টেস্টের জন্য:\n1. এই alert বন্ধ করুন\n2. দ্রুত ব্রাউজার minimize করুন বা অন্য tab এ যান\n3. ৩ সেকেন্ড পর notification আসবে');
        
        // Delay to give user time to switch
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      console.log('[FCM Debug] 📤 Sending test notification (background:', isBackground, ')...');
      
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          user_id: profile.user_id,
          title: isBackground ? '🔔 ব্যাকগ্রাউন্ড টেস্ট' : '🔔 টেস্ট নোটিফিকেশন',
          body: isBackground 
            ? 'ব্যাকগ্রাউন্ড নোটিফিকেশন সফলভাবে কাজ করছে!' 
            : 'Foreground নোটিফিকেশন - Toast দেখতে পাচ্ছেন?',
          data: {
            type: 'test',
            click_action: '/admin',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('[FCM Debug] ❌ Test notification error:', error);
        alert('Error: ' + error.message);
      } else {
        console.log('[FCM Debug] ✅ Test notification sent:', data);
        if (!isBackground) {
          // For foreground, expect toast to appear
          console.log('[FCM Debug] Expecting toast notification...');
        }
      }
    } catch (err) {
      console.error('[FCM Debug] ❌ Error sending test notification:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const getStatusIcon = (value: boolean | string) => {
    if (value === true || value === 'granted') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (value === false || value === 'denied') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>FCM Token ডিবাগ প্যানেল</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkStatus}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            রিফ্রেশ
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">Notification Permission:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.notificationPermission)}
              <Badge variant={status.notificationPermission === 'granted' ? 'default' : 'destructive'}>
                {status.notificationPermission}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">Service Worker:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.serviceWorkerReady)}
              <Badge variant={status.serviceWorkerReady ? 'default' : 'destructive'}>
                {status.serviceWorkerReady ? 'Ready' : 'Not Ready'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">Firebase Initialized:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.firebaseInitialized)}
              <Badge variant={status.firebaseInitialized ? 'default' : 'destructive'}>
                {status.firebaseInitialized ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">FCM Token:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(!!status.fcmToken)}
              <Badge variant={status.fcmToken ? 'default' : 'secondary'}>
                {status.fcmToken ? 'Generated' : 'Not Generated'}
              </Badge>
            </div>
          </div>

          {status.fcmToken && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-mono break-all">{status.fcmToken}</p>
            </div>
          )}
        </div>

        {status.error && (
          <Alert variant="destructive">
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Button 
            className="w-full" 
            variant="destructive"
            onClick={handleResetAllTokens}
            disabled={!profile?.user_id}
          >
            🗑️ সব টোকেন রিসেট করুন
          </Button>

          <Button 
            className="w-full" 
            onClick={handleGenerateToken}
            disabled={isGenerating || !profile?.user_id}
          >
            {isGenerating ? 'তৈরি হচ্ছে...' : 'FCM Token তৈরি করুন'}
          </Button>

          <Button 
            className="w-full" 
            variant="secondary"
            onClick={() => handleSendTestNotification(false)}
            disabled={!status.fcmToken || !profile?.user_id}
          >
            <Send className="h-4 w-4 mr-2" />
            Foreground টেস্ট (Toast দেখুন)
          </Button>

          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => handleSendTestNotification(true)}
            disabled={!status.fcmToken || !profile?.user_id}
          >
            <Bell className="h-4 w-4 mr-2" />
            Background টেস্ট (ব্রাউজার minimize করুন)
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>📌 Console logs দেখুন `[FCM Debug]` prefix সহ</p>
          <p>📌 Browser DevTools Console খুলুন (F12)</p>
          <p>📌 টোকেন তৈরির পর টেস্ট নোটিফিকেশন পাঠিয়ে যাচাই করুন</p>
        </div>
      </CardContent>
    </Card>
  );
}
