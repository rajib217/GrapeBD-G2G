import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Notice {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_read?: boolean;
}

const UserNotices = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchNotices = async () => {
    if (!profile?.id) return;

    try {
      // First, get all active notices
      const { data: noticesData, error: noticesError } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (noticesError) throw noticesError;

      // Then get read status for current user
      const { data: readData, error: readError } = await supabase
        .from('user_notice_reads')
        .select('notice_id')
        .eq('user_id', profile.id);

      if (readError) throw readError;

      // Combine data
      const readNoticeIds = new Set(readData?.map(r => r.notice_id) || []);
      const noticesWithReadStatus = (noticesData || []).map(notice => ({
        ...notice,
        is_read: readNoticeIds.has(notice.id)
      }));

      setNotices(noticesWithReadStatus);
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'নোটিশ লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [profile?.id]);

  const markAsRead = async (noticeId: string) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('user_notice_reads')
        .upsert(
          { user_id: profile.id, notice_id: noticeId },
          { onConflict: 'user_id,notice_id' }
        );

      if (error) throw error;

      // Update local state
      setNotices(prev => prev.map(notice => 
        notice.id === noticeId ? { ...notice, is_read: true } : notice
      ));
    } catch (error) {
      console.error('Error marking notice as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const unreadCount = notices.filter(notice => !notice.is_read).length;

  if (loading) {
    return <div className="text-center py-8">লোড হচ্ছে...</div>;
  }

  if (notices.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BellOff className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">কোন নোটিশ নেই</h3>
          <p className="text-gray-500">এখনো কোন নোটিশ প্রকাশ করা হয়নি</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <Bell className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">সকল নোটিশ</h2>
        <Badge variant="secondary">{notices.length} টি</Badge>
        {unreadCount > 0 && (
          <Badge variant="destructive">{unreadCount} টি নতুন</Badge>
        )}
      </div>
      
      {notices.map((notice) => (
        <Card 
          key={notice.id} 
          className={`hover:shadow-md transition-shadow cursor-pointer ${
            !notice.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
          }`}
          onClick={() => !notice.is_read && markAsRead(notice.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2 flex-1">
                {!notice.is_read && (
                  <Circle className="h-3 w-3 text-blue-500 fill-current mt-1 flex-shrink-0" />
                )}
                <CardTitle className={`text-lg pr-4 ${
                  !notice.is_read ? 'text-blue-700 font-semibold' : 'text-gray-700'
                }`}>
                  {notice.title}
                </CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                {!notice.is_read && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    নতুন
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {formatDate(notice.created_at)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className={`whitespace-pre-wrap leading-relaxed ${
                !notice.is_read ? 'text-gray-800' : 'text-gray-700'
              }`}>
                {notice.content}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UserNotices;