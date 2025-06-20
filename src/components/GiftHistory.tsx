
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Gift, Leaf, Send, ArrowRight, User } from 'lucide-react';

interface GiftRecord {
  id: number;
  type: 'sent' | 'received';
  seedlingName: string;
  quantity: number;
  memberName: string;
  memberLocation: string;
  date: string;
  message?: string;
  status: 'pending' | 'delivered' | 'cancelled';
}

const GiftHistory = () => {
  const [gifts] = useState<GiftRecord[]>([
    {
      id: 1,
      type: 'sent',
      seedlingName: 'আমের চারা',
      quantity: 2,
      memberName: 'রহিম উদ্দিন',
      memberLocation: 'ঢাকা',
      date: '২০২৪-০৬-১৫',
      message: 'আপনার জন্য বিশেষ উপহার',
      status: 'delivered',
    },
    {
      id: 2,
      type: 'received',
      seedlingName: 'গোলাপের চারা',
      quantity: 3,
      memberName: 'ফাতেমা খাতুন',
      memberLocation: 'সিলেট',
      date: '২০২৪-০৬-১২',
      message: 'আপনার বাগানের জন্য',
      status: 'delivered',
    },
    {
      id: 3,
      type: 'sent',
      seedlingName: 'নিমের চারা',
      quantity: 1,
      memberName: 'করিম আহমেদ',
      memberLocation: 'চট্টগ্রাম',
      date: '২০২৪-০৬-১০',
      status: 'pending',
    },
    {
      id: 4,
      type: 'received',
      seedlingName: 'তুলসী গাছ',
      quantity: 2,
      memberName: 'আব্দুল কাদের',
      memberLocation: 'রাজশাহী',
      date: '২০২৪-০৬-০৮',
      status: 'delivered',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'পৌঁছেছে';
      case 'pending':
        return 'অপেক্ষমাণ';
      case 'cancelled':
        return 'বাতিল';
      default:
        return status;
    }
  };

  const sentGifts = gifts.filter(g => g.type === 'sent');
  const receivedGifts = gifts.filter(g => g.type === 'received');

  const GiftCard = ({ gift }: { gift: GiftRecord }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${gift.type === 'sent' ? 'bg-blue-100' : 'bg-green-100'}`}>
              {gift.type === 'sent' ? (
                <Send className="h-4 w-4 text-blue-600" />
              ) : (
                <Gift className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-lg">{gift.seedlingName}</h4>
              <p className="text-sm text-gray-600">{gift.quantity} টি</p>
            </div>
          </div>
          <Badge className={getStatusColor(gift.status)}>
            {getStatusText(gift.status)}
          </Badge>
        </div>

        <div className="flex items-center space-x-2 mb-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {gift.type === 'sent' ? 'পাঠানো হয়েছে' : 'পেয়েছেন'} {gift.memberName} 
            <span className="text-gray-500 ml-1">({gift.memberLocation})</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{gift.date}</span>
        </div>

        {gift.message && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm italic">"{gift.message}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800">উপহার ইতিহাস</h3>
        <div className="flex space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            পাঠানো: {sentGifts.length}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            পাওয়া: {receivedGifts.length}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">সব</TabsTrigger>
          <TabsTrigger value="sent">পাঠানো</TabsTrigger>
          <TabsTrigger value="received">পাওয়া</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {gifts.map((gift) => (
            <GiftCard key={gift.id} gift={gift} />
          ))}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentGifts.map((gift) => (
            <GiftCard key={gift.id} gift={gift} />
          ))}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          {receivedGifts.map((gift) => (
            <GiftCard key={gift.id} gift={gift} />
          ))}
        </TabsContent>
      </Tabs>

      {gifts.length === 0 && (
        <div className="text-center py-12">
          <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">কোন ইতিহাস নেই</h3>
          <p className="text-gray-400">এখনও কোন উপহার পাঠানো বা পাওয়া হয়নি</p>
        </div>
      )}
    </div>
  );
};

export default GiftHistory;
