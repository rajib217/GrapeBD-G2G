import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Gift, Send, Inbox, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SentGift {
  id: string;
  quantity: number;
  status: 'pending' | 'approved' | 'sent' | 'received' | 'cancelled';
  created_at: string;
  sent_at: string | null;
  received_at: string | null;
  admin_notes: string | null;
  variety: {
    name: string;
    thumbnail_image: string | null;
  };
  receiver: {
    id: string;
    full_name: string;
  } | null;
  gift_round: {
    title: string;
  };
}

interface ReceivedGift {
  id: string;
  quantity: number;
  status: 'pending' | 'approved' | 'sent' | 'received' | 'cancelled';
  created_at: string;
  sent_at: string | null;
  received_at: string | null;
  admin_notes: string | null;
  variety: {
    name: string;
    thumbnail_image: string | null;
  };
  sender: {
    id: string;
    full_name: string;
  } | null;
  gift_round: {
    title: string;
  };
}

const GiftHistory = () => {
  const [sentGifts, setSentGifts] = useState<SentGift[]>([]);
  const [receivedGifts, setReceivedGifts] = useState<ReceivedGift[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchGifts = async () => {
    if (!profile?.id) return;

    try {
      // Fetch sent gifts
      const { data: sentData, error: sentError } = await supabase
        .from('gifts')
        .select(`
          id,
          quantity,
          status,
          created_at,
          sent_at,
          received_at,
          admin_notes,
          variety:varieties(name, thumbnail_image),
          receiver:profiles!gifts_receiver_id_fkey(id, full_name),
          gift_round:gift_rounds(title)
        `)
        .eq('sender_id', profile.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Fetch received gifts
      const { data: receivedData, error: receivedError } = await supabase
        .from('gifts')
        .select(`
          id,
          quantity,
          status,
          created_at,
          sent_at,
          received_at,
          admin_notes,
          variety:varieties(name, thumbnail_image),
          sender:profiles!gifts_sender_id_fkey(id, full_name),
          gift_round:gift_rounds(title)
        `)
        .eq('receiver_id', profile.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      setSentGifts(sentData || []);
      setReceivedGifts(receivedData || []);
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'উপহারের ইতিহাস লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGifts();
  }, [profile?.id]);

  const handleMarkReceived = async (giftId: string) => {
    try {
      const { error } = await supabase
        .from('gifts')
        .update({
          status: 'received',
          received_at: new Date().toISOString(),
        })
        .eq('id', giftId);

      if (error) throw error;

      toast({
        title: 'সফল',
        description: 'উপহার গ্রহণ নিশ্চিত করা হয়েছে',
      });

      fetchGifts();
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'উপহার গ্রহণ নিশ্চিত করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'received':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'অপেক্ষায়';
      case 'approved':
        return 'অনুমোদিত';
      case 'sent':
        return 'পাঠানো হয়েছে';
      case 'received':
        return 'গ্রহণ করা হয়েছে';
      case 'cancelled':
        return 'বাতিল';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'sent':
        return 'default';
      case 'received':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  if (loading) {
    return <div className="text-center py-8">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Tabs defaultValue="sent" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="sent" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 text-xs sm:text-sm">
            <Send className="h-4 w-4" />
            <span className="text-center">পাঠানো উপহার<br className="sm:hidden" />({sentGifts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="received" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 text-xs sm:text-sm">
            <Inbox className="h-4 w-4" />
            <span className="text-center">প্রাপ্ত উপহার<br className="sm:hidden" />({receivedGifts.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="space-y-4">
          {sentGifts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Send className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">কোন পাঠানো উপহার নেই</h3>
                <p className="text-gray-500">আপনি এখনো কোন উপহার পাঠাননি</p>
              </CardContent>
            </Card>
          ) : (
            sentGifts.map((gift) => (
              <Card key={gift.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {gift.variety.thumbnail_image && (
                        <Avatar className="h-10 w-10 sm:h-8 sm:w-8 ring-2 ring-green-100 shrink-0">
                          <AvatarImage 
                            src={gift.variety.thumbnail_image} 
                            alt={gift.variety.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                            {gift.variety.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex items-center space-x-2 min-w-0">
                        {getStatusIcon(gift.status)}
                        <CardTitle className="text-base sm:text-lg truncate">{gift.variety.name}</CardTitle>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(gift.status)} className="self-start sm:self-center shrink-0">
                      {getStatusText(gift.status)}
                    </Badge>
                  </div>
                  <CardDescription className="mt-2">
                    {gift.receiver ? (
                      <button 
                        onClick={() => handleUserClick(gift.receiver!.id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                      >
                        {gift.receiver.full_name}
                      </button>
                    ) : 'অজানা প্রাপক'} এর কাছে পাঠানো • {gift.gift_round.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">পরিমাণ:</span>
                      <span className="font-semibold text-green-700">{gift.quantity} টি</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">তারিখ:</span>
                      <span className="text-right">{formatDate(gift.created_at)}</span>
                    </div>
                    {gift.sent_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">পাঠানোর তারিখ:</span>
                        <span>{formatDate(gift.sent_at)}</span>
                      </div>
                    )}
                    {gift.received_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">প্রাপ্তির তারিখ:</span>
                        <span>{formatDate(gift.received_at)}</span>
                      </div>
                    )}
                    {gift.admin_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">অ্যাডমিনের নোট:</p>
                        <p className="text-sm">{gift.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          {receivedGifts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Inbox className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">কোন প্রাপ্ত উপহার নেই</h3>
                <p className="text-gray-500">আপনি এখনো কোন উপহার পাননি</p>
              </CardContent>
            </Card>
          ) : (
            receivedGifts.map((gift) => (
              <Card key={gift.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {gift.variety.thumbnail_image && (
                        <Avatar className="h-10 w-10 sm:h-8 sm:w-8 ring-2 ring-green-100 shrink-0">
                          <AvatarImage 
                            src={gift.variety.thumbnail_image} 
                            alt={gift.variety.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                            {gift.variety.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex items-center space-x-2 min-w-0">
                        {getStatusIcon(gift.status)}
                        <CardTitle className="text-base sm:text-lg truncate">{gift.variety.name}</CardTitle>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(gift.status)} className="self-start sm:self-center shrink-0">
                      {getStatusText(gift.status)}
                    </Badge>
                  </div>
                  <CardDescription className="mt-2">
                    {gift.sender ? (
                      <button 
                        onClick={() => handleUserClick(gift.sender!.id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                      >
                        {gift.sender.full_name}
                      </button>
                    ) : 'অজানা প্রেরক'} এর কাছ থেকে • {gift.gift_round.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">পরিমাণ:</span>
                      <span className="font-semibold text-green-700">{gift.quantity} টি</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">তারিখ:</span>
                      <span className="text-right">{formatDate(gift.created_at)}</span>
                    </div>
                    {gift.sent_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">পাঠানোর তারিখ:</span>
                        <span>{formatDate(gift.sent_at)}</span>
                      </div>
                    )}
                    {gift.received_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">প্রাপ্তির তারিখ:</span>
                        <span>{formatDate(gift.received_at)}</span>
                      </div>
                    )}
                    {gift.admin_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">অ্যাডমিনের নোট:</p>
                        <p className="text-sm">{gift.admin_notes}</p>
                      </div>
                    )}
                  </div>
                  
                  {gift.status === 'sent' && (
                    <div className="mt-4">
                      <Button 
                        onClick={() => handleMarkReceived(gift.id)}
                        size="sm"
                        className="w-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        উপহার গ্রহণ নিশ্চিত করুন
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GiftHistory;