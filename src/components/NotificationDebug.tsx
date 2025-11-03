import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { requestNotificationPermission, setupPushNotifications } from '@/services/notification';
import { supabase } from '@/integrations/supabase/client';

const NotificationDebug = () => {
  const { profile } = useAuth();
  const [status, setStatus] = useState({
    permission: 'unknown',
    serviceWorker: false,
    fcmToken: false,
    dbTokens: 0,
  });

  const checkStatus = async () => {
    const newStatus: any = {
      permission: 'Notification' in window ? Notification.permission : 'unsupported',
      serviceWorker: false,
      fcmToken: false,
      dbTokens: 0,
    };

    // Check Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        newStatus.serviceWorker = !!registration;
      } catch (err) {
        console.error('SW check error:', err);
      }
    }

    // Check FCM Token in localStorage
    if (profile?.user_id) {
      const localToken = localStorage.getItem(`fcm_token_${profile.user_id}`);
      newStatus.fcmToken = !!localToken;

      // Check database tokens
      try {
        const { count } = await supabase
          .from('fcm_tokens')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.user_id);
        
        newStatus.dbTokens = count || 0;
      } catch (err) {
        console.error('DB check error:', err);
      }
    }

    setStatus(newStatus);
  };

  useEffect(() => {
    checkStatus();
  }, [profile?.user_id]);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted && profile?.user_id) {
      await setupPushNotifications(profile.user_id);
    }
    await checkStatus();
  };

  const getStatusIcon = (value: boolean | string) => {
    if (value === true || value === 'granted') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (value === false || value === 'denied') return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          নটিফিকেশন স্ট্যাটাস
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(status.permission)}
              <div>
                <p className="font-medium">Browser Permission</p>
                <p className="text-sm text-muted-foreground">
                  {status.permission === 'granted' ? 'অনুমতি দেওয়া হয়েছে' :
                   status.permission === 'denied' ? 'অনুমতি প্রত্যাখ্যান করা হয়েছে' :
                   status.permission === 'default' ? 'এখনও জিজ্ঞাসা করা হয়নি' :
                   'সমর্থিত নয়'}
                </p>
              </div>
            </div>
            <Badge variant={status.permission === 'granted' ? 'default' : 'destructive'}>
              {status.permission}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(status.serviceWorker)}
              <div>
                <p className="font-medium">Service Worker</p>
                <p className="text-sm text-muted-foreground">
                  {status.serviceWorker ? 'Registered এবং সক্রিয়' : 'Registered নয়'}
                </p>
              </div>
            </div>
            <Badge variant={status.serviceWorker ? 'default' : 'destructive'}>
              {status.serviceWorker ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(status.fcmToken)}
              <div>
                <p className="font-medium">FCM Token</p>
                <p className="text-sm text-muted-foreground">
                  {status.fcmToken ? 'Token তৈরি হয়েছে' : 'Token তৈরি হয়নি'}
                </p>
              </div>
            </div>
            <Badge variant={status.fcmToken ? 'default' : 'destructive'}>
              {status.fcmToken ? 'Generated' : 'Not Generated'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(status.dbTokens > 0)}
              <div>
                <p className="font-medium">Database Tokens</p>
                <p className="text-sm text-muted-foreground">
                  {status.dbTokens} টি token সংরক্ষিত আছে
                </p>
              </div>
            </div>
            <Badge variant={status.dbTokens > 0 ? 'default' : 'destructive'}>
              {status.dbTokens} tokens
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleRequestPermission} className="flex-1">
            <Bell className="h-4 w-4 mr-2" />
            অনুমতি চান
          </Button>
          <Button onClick={checkStatus} variant="outline">
            রিফ্রেশ করুন
          </Button>
        </div>

        {status.permission === 'denied' && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              <strong>সতর্কতা:</strong> Browser notification permission blocked আছে। 
              Browser settings থেকে permission enable করতে হবে।
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationDebug;
