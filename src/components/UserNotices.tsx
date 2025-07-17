import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Notice {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

const UserNotices = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
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
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
      </div>
      
      {notices.map((notice) => (
        <Card key={notice.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg text-blue-700 pr-4">
                {notice.title}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {formatDate(notice.created_at)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
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