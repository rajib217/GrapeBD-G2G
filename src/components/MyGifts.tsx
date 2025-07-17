
import { useState, useEffect } from 'react';
import { Gift, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserGift {
  id: string;
  sender_id: string;
  receiver_id: string;
  variety_id: string;
  gift_round_id: string;
  quantity: number;
  status: 'pending' | 'approved' | 'sent' | 'received' | 'cancelled';
  admin_notes?: string;
  created_at: string;
  approved_at?: string;
  sent_at?: string;
  received_at?: string;
  sender_name?: string;
  variety_name?: string;
  variety_thumbnail?: string;
  round_title?: string;
}

const MyGifts = () => {
  const [receivedGifts, setReceivedGifts] = useState<UserGift[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchMyGifts();
    }
  }, [profile?.id]);

  const fetchMyGifts = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('gifts')
        .select(`
          *,
          sender:profiles!gifts_sender_id_fkey(full_name),
          variety:varieties(name, thumbnail_image),
          gift_round:gift_rounds(title)
        `)
        .eq('receiver_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const enrichedGifts = data?.map(gift => ({
        ...gift,
        sender_name: gift.sender?.full_name,
        variety_name: gift.variety?.name,
        variety_thumbnail: gift.variety?.thumbnail_image,
        round_title: gift.gift_round?.title
      })) || [];
      
      setReceivedGifts(enrichedGifts);
    } catch (error) {
      console.error('Error fetching my gifts:', error);
      toast({
        title: "ত্রুটি",
        description: "আপনার গিফট তালিকা লোড করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveGift = async (giftId: string) => {
    try {
      // Update gift status to received without adding to stock
      const { error: updateError } = await supabase
        .from('gifts')
        .update({ 
          status: 'received',
          received_at: new Date().toISOString()
        })
        .eq('id', giftId);

      if (updateError) throw updateError;
      
      toast({
        title: "সফল",
        description: "গিফট প্রাপ্ত হিসেবে চিহ্নিত করা হয়েছে",
      });
      
      fetchMyGifts();
    } catch (error) {
      console.error('Error updating gift status:', error);
      toast({
        title: "ত্রুটি",
        description: "গিফট স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'অপেক্ষমাণ',
      approved: 'অনুমোদিত',
      sent: 'পাঠানো হয়েছে',
      received: 'প্রাপ্ত',
      cancelled: 'বাতিল'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants = {
      pending: 'outline',
      approved: 'default',
      sent: 'secondary',
      received: 'default',
      cancelled: 'destructive'
    };
    return variants[status as keyof typeof variants] || 'outline';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
      case 'received':
        return <CheckCircle className="h-4 w-4" />;
      case 'sent':
        return <Package className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="bg-green-600 p-3 rounded-full">
          <Gift className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-green-800">আমার গিফট</h2>
          <p className="text-muted-foreground">আপনার জন্য পাঠানো চারার তালিকা</p>
        </div>
      </div>

      {/* Gifts List */}
      <div className="space-y-4">
        {receivedGifts.map((gift) => (
          <Card key={gift.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  {gift.variety_thumbnail ? (
                    <img 
                      src={gift.variety_thumbnail} 
                      alt={gift.variety_name}
                      className="w-12 h-12 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      {getStatusIcon(gift.status)}
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">
                      {gift.variety_name} - {gift.quantity}টি চারা
                    </CardTitle>
                    <CardDescription>
                      প্রেরক: {gift.sender_name} | রাউন্ড: {gift.round_title}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={getStatusVariant(gift.status) as any}>
                  {getStatusLabel(gift.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>তৈরি: {new Date(gift.created_at).toLocaleDateString('bn-BD')}</span>
                  {gift.received_at && (
                    <span>প্রাপ্ত: {new Date(gift.received_at).toLocaleDateString('bn-BD')}</span>
                  )}
                </div>
                
                {gift.admin_notes && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-1">অ্যাডমিন নোট:</p>
                    <p className="text-sm text-blue-700">{gift.admin_notes}</p>
                  </div>
                )}

                {gift.status === 'sent' && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleReceiveGift(gift.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      প্রাপ্ত হিসেবে চিহ্নিত করুন
                    </Button>
                  </div>
                )}

                {/* Timeline */}
                <div className="border-l-2 border-gray-200 pl-4 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-muted-foreground">
                      তৈরি: {new Date(gift.created_at).toLocaleString('bn-BD')}
                    </span>
                  </div>
                  
                  {gift.approved_at && (
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-muted-foreground">
                        অনুমোদিত: {new Date(gift.approved_at).toLocaleString('bn-BD')}
                      </span>
                    </div>
                  )}
                  
                  {gift.sent_at && (
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-muted-foreground">
                        পাঠানো: {new Date(gift.sent_at).toLocaleString('bn-BD')}
                      </span>
                    </div>
                  )}
                  
                  {gift.received_at && (
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-muted-foreground">
                        প্রাপ্ত: {new Date(gift.received_at).toLocaleString('bn-BD')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {receivedGifts.length === 0 && (
        <div className="text-center py-12">
          <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">কোনো গিফট নেই</h3>
          <p className="text-muted-foreground">আপনার জন্য এখনো কোনো গিফট পাঠানো হয়নি</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{receivedGifts.length}</div>
            <p className="text-sm text-muted-foreground">মোট গিফট</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{receivedGifts.filter(g => g.status === 'pending').length}</div>
            <p className="text-sm text-muted-foreground">অপেক্ষমাণ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{receivedGifts.filter(g => g.status === 'sent').length}</div>
            <p className="text-sm text-muted-foreground">পাঠানো হয়েছে</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{receivedGifts.filter(g => g.status === 'received').length}</div>
            <p className="text-sm text-muted-foreground">প্রাপ্ত</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyGifts;
