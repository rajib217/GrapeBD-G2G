
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
}

interface Stock {
  id: string;
  quantity: number;
  variety: {
    id: string;
    name: string;
  };
}

interface GiftRound {
  id: string;
  title: string;
  description: string | null;
}

interface AssignedGift {
  id: string;
  receiver_id: string;
  variety_id: string;
  quantity: number;
  gift_round_id: string;
  admin_notes: string | null;
  receiver_name: string;
  variety_name: string;
  round_title: string;
}

const SendGift = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [giftRounds, setGiftRounds] = useState<GiftRound[]>([]);
  const [assignedGifts, setAssignedGifts] = useState<AssignedGift[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState('');
  const [selectedStock, setSelectedStock] = useState('');
  const [selectedGiftRound, setSelectedGiftRound] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    if (!profile?.id) return;

    try {
      // Fetch active profiles (excluding current user)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('status', 'active')
        .neq('id', profile.id)
        .order('full_name');

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch user's stocks
      const { data: stocksData, error: stocksError } = await supabase
        .from('user_stocks')
        .select(`
          id,
          quantity,
          variety:varieties(id, name)
        `)
        .eq('user_id', profile.id)
        .gt('quantity', 0);

      if (stocksError) throw stocksError;
      setStocks(stocksData || []);

      // Fetch active gift rounds
      const { data: roundsData, error: roundsError } = await supabase
        .from('gift_rounds')
        .select('id, title, description')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (roundsError) throw roundsError;
      setGiftRounds(roundsData || []);

      // Fetch assigned gifts (approved status gifts where current user is sender)
      const { data: assignedData, error: assignedError } = await supabase
        .from('gifts')
        .select(`
          id,
          receiver_id,
          variety_id,
          quantity,
          gift_round_id,
          admin_notes,
          receiver:profiles!gifts_receiver_id_fkey(full_name),
          variety:varieties(name),
          gift_round:gift_rounds(title)
        `)
        .eq('sender_id', profile.id)
        .eq('status', 'approved');

      if (assignedError) throw assignedError;
      
      const enrichedAssignedGifts = assignedData?.map(gift => ({
        ...gift,
        receiver_name: gift.receiver?.full_name || '',
        variety_name: gift.variety?.name || '',
        round_title: gift.gift_round?.title || ''
      })) || [];
      
      setAssignedGifts(enrichedAssignedGifts);
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'তথ্য লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !selectedReceiver || !selectedStock || !selectedGiftRound || !quantity) return;

    const selectedStockItem = stocks.find(s => s.id === selectedStock);
    if (!selectedStockItem || parseInt(quantity) > selectedStockItem.quantity) {
      toast({
        title: 'ত্রুটি',
        description: 'পর্যাপ্ত চারা নেই',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create gift record
      const { error: giftError } = await supabase
        .from('gifts')
        .insert({
          sender_id: profile.id,
          receiver_id: selectedReceiver,
          variety_id: selectedStockItem.variety.id,
          quantity: parseInt(quantity),
          gift_round_id: selectedGiftRound,
          status: 'pending',
        });

      if (giftError) throw giftError;

      // Update sender's stock
      const { error: stockError } = await supabase
        .from('user_stocks')
        .update({
          quantity: selectedStockItem.quantity - parseInt(quantity),
        })
        .eq('id', selectedStock);

      if (stockError) throw stockError;

      toast({
        title: 'সফল',
        description: 'উপহার সফলভাবে পাঠানো হয়েছে! অ্যাডমিনের অনুমোদনের অপেক্ষায় রয়েছে।',
      });

      // Reset form
      setSelectedReceiver('');
      setSelectedStock('');
      setSelectedGiftRound('');
      setQuantity('');
      fetchData(); // Refresh data
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'উপহার পাঠাতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendAssignedGift = async (assignedGift: AssignedGift) => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Check if sender has enough stock
      const { data: senderStock, error: senderStockError } = await supabase
        .from('user_stocks')
        .select('id, quantity')
        .eq('user_id', profile.id)
        .eq('variety_id', assignedGift.variety_id)
        .single();

      if (senderStockError || !senderStock || senderStock.quantity < assignedGift.quantity) {
        toast({
          title: 'ত্রুটি',
          description: 'আপনার কাছে পর্যাপ্ত স্টক নেই',
          variant: 'destructive',
        });
        return;
      }

      // Update gift status to sent
      const { error: giftUpdateError } = await supabase
        .from('gifts')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', assignedGift.id);

      if (giftUpdateError) throw giftUpdateError;

      // Update sender's stock (decrease)
      const { error: senderUpdateError } = await supabase
        .from('user_stocks')
        .update({
          quantity: senderStock.quantity - assignedGift.quantity
        })
        .eq('id', senderStock.id);

      if (senderUpdateError) throw senderUpdateError;

      // Check if receiver already has this variety
      const { data: receiverStock, error: receiverStockError } = await supabase
        .from('user_stocks')
        .select('id, quantity')
        .eq('user_id', assignedGift.receiver_id)
        .eq('variety_id', assignedGift.variety_id)
        .maybeSingle();

      if (receiverStockError) throw receiverStockError;

      if (receiverStock) {
        // Update existing stock
        const { error: receiverUpdateError } = await supabase
          .from('user_stocks')
          .update({
            quantity: receiverStock.quantity + assignedGift.quantity
          })
          .eq('id', receiverStock.id);

        if (receiverUpdateError) throw receiverUpdateError;
      } else {
        // Create new stock entry
        const { error: receiverCreateError } = await supabase
          .from('user_stocks')
          .insert({
            user_id: assignedGift.receiver_id,
            variety_id: assignedGift.variety_id,
            quantity: assignedGift.quantity
          });

        if (receiverCreateError) throw receiverCreateError;
      }

      toast({
        title: 'সফল',
        description: 'গিফট সফলভাবে পাঠানো হয়েছে এবং স্টক আপডেট করা হয়েছে!',
      });

      fetchData(); // Refresh data
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'গিফট পাঠাতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedStockItem = stocks.find(s => s.id === selectedStock);
  const maxQuantity = selectedStockItem?.quantity || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Admin Assigned Gifts Section */}
      {assignedGifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span>এডমিনের এসাইন করা গিফট</span>
            </CardTitle>
            <CardDescription>
              এডমিন আপনাকে নিম্নলিখিত গিফটগুলি পাঠানোর জন্য এসাইন করেছেন
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignedGifts.map((gift) => (
                <div key={gift.id} className="border rounded-lg p-4 bg-orange-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {gift.receiver_name} কে {gift.variety_name} পাঠান
                      </h4>
                      <p className="text-sm text-gray-600">
                        পরিমাণ: {gift.quantity}টি | রাউন্ড: {gift.round_title}
                      </p>
                      {gift.admin_notes && (
                        <p className="text-sm text-blue-600 mt-1">
                          নোট: {gift.admin_notes}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="bg-orange-100">
                      অনুমোদিত
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleSendAssignedGift(gift)}
                    disabled={loading}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'পাঠানো হচ্ছে...' : 'এই গিফট পাঠান'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Gift Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="h-5 w-5" />
            <span>নতুন উপহার পাঠান</span>
          </CardTitle>
          <CardDescription>
            অন্য সদস্যদের কাছে চারা উপহার পাঠান
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="giftRound">গিফট রাউন্ড নির্বাচন করুন *</Label>
              <Select value={selectedGiftRound} onValueChange={setSelectedGiftRound}>
                <SelectTrigger>
                  <SelectValue placeholder="একটি গিফট রাউন্ড নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {giftRounds.map((round) => (
                    <SelectItem key={round.id} value={round.id}>
                      <div>
                        <div className="font-medium">{round.title}</div>
                        {round.description && (
                          <div className="text-sm text-gray-500">{round.description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="receiver">গ্রহীতা নির্বাচন করুন *</Label>
              <Select value={selectedReceiver} onValueChange={setSelectedReceiver}>
                <SelectTrigger>
                  <SelectValue placeholder="একজন সদস্য নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        {user.email && (
                          <div className="text-sm text-gray-500">{user.email}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="stock">চারার জাত নির্বাচন করুন *</Label>
              <Select value={selectedStock} onValueChange={setSelectedStock}>
                <SelectTrigger>
                  <SelectValue placeholder="চারার জাত নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {stocks.map((stock) => (
                    <SelectItem key={stock.id} value={stock.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{stock.variety.name}</span>
                        <span className="text-sm text-gray-500">
                          ({stock.quantity} টি আছে)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">পরিমাণ *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`সর্বোচ্চ ${maxQuantity} টি`}
                required
                disabled={!selectedStock}
              />
              {selectedStockItem && (
                <p className="text-sm text-gray-500 mt-1">
                  আপনার কাছে {selectedStockItem.quantity} টি {selectedStockItem.variety.name} আছে
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !selectedReceiver || !selectedStock || !selectedGiftRound || !quantity}
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'পাঠানো হচ্ছে...' : 'উপহার পাঠান'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {giftRounds.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">
              কোন সক্রিয় গিফট রাউন্ড নেই। উপহার পাঠানোর জন্য অপেক্ষা করুন।
            </p>
          </CardContent>
        </Card>
      )}

      {stocks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">
              আপনার কোন চারা নেই। প্রথমে চারা যোগ করুন।
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SendGift;
