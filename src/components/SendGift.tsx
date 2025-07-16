import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

const SendGift = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [giftRounds, setGiftRounds] = useState<GiftRound[]>([]);
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

  const selectedStockItem = stocks.find(s => s.id === selectedStock);
  const maxQuantity = selectedStockItem?.quantity || 0;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="h-5 w-5" />
            <span>উপহার পাঠান</span>
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
        <Card className="mt-6">
          <CardContent className="text-center py-8">
            <p className="text-gray-600">
              কোন সক্রিয় গিফট রাউন্ড নেই। উপহার পাঠানোর জন্য অপেক্ষা করুন।
            </p>
          </CardContent>
        </Card>
      )}

      {stocks.length === 0 && (
        <Card className="mt-6">
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