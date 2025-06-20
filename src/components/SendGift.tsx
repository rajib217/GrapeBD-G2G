
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Gift, Send, User, Leaf } from 'lucide-react';

const SendGift = () => {
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedSeedling, setSelectedSeedling] = useState('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');

  // ডামি ডেটা - আসলে API থেকে আসবে
  const members = [
    { id: '1', name: 'রহিম উদ্দিন', location: 'ঢাকা' },
    { id: '2', name: 'করিম আহমেদ', location: 'চট্টগ্রাম' },
    { id: '3', name: 'ফাতেমা খাতুন', location: 'সিলেট' },
    { id: '4', name: 'আব্দুল কাদের', location: 'রাজশাহী' },
  ];

  const mySeedlings = [
    { id: '1', name: 'আমের চারা', available: 5 },
    { id: '2', name: 'জামের চারা', available: 3 },
    { id: '3', name: 'নিমের চারা', available: 8 },
    { id: '4', name: 'তুলসী গাছ', available: 4 },
    { id: '5', name: 'গোলাপের চারা', available: 6 },
  ];

  const handleSendGift = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember || !selectedSeedling || !quantity) {
      toast({
        title: "ত্রুটি",
        description: "সকল প্রয়োজনীয় ক্ষেত্র পূরণ করুন",
        variant: "destructive",
      });
      return;
    }

    const selectedSeedlingData = mySeedlings.find(s => s.id === selectedSeedling);
    const selectedMemberData = members.find(m => m.id === selectedMember);
    
    if (selectedSeedlingData && parseInt(quantity) > selectedSeedlingData.available) {
      toast({
        title: "ত্রুটি",
        description: "আপনার কাছে পর্যাপ্ত চারা নেই",
        variant: "destructive",
      });
      return;
    }

    // এখানে API কল করে গিফট পাঠানো হবে
    console.log('Sending gift:', {
      member: selectedMemberData,
      seedling: selectedSeedlingData,
      quantity,
      message
    });

    toast({
      title: "উপহার পাঠানো হয়েছে!",
      description: `${selectedMemberData?.name} এর কাছে ${quantity}টি ${selectedSeedlingData?.name} পাঠানো হয়েছে`,
    });

    // ফর্ম রিসেট
    setSelectedMember('');
    setSelectedSeedling('');
    setQuantity('');
    setMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Gift className="h-6 w-6 text-pink-600" />
            <CardTitle className="text-2xl text-pink-700">চারা উপহার পাঠান</CardTitle>
          </div>
          <CardDescription>
            আপনার বন্ধুদের কাছে চারা উপহার পাঠিয়ে পরিবেশ রক্ষায় অংশগ্রহণ করুন
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendGift} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="member">প্রাপক নির্বাচন করুন *</Label>
              <Select onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="কার কাছে পাঠাবেন?" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-gray-500">{member.location}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seedling">চারা নির্বাচন করুন *</Label>
              <Select onValueChange={setSelectedSeedling}>
                <SelectTrigger>
                  <SelectValue placeholder="কোন চারা পাঠাবেন?" />
                </SelectTrigger>
                <SelectContent>
                  {mySeedlings.map((seedling) => (
                    <SelectItem key={seedling.id} value={seedling.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <Leaf className="h-4 w-4 text-green-600" />
                          <span>{seedling.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          ({seedling.available} টি আছে)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">পরিমাণ *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="কতটি চারা পাঠাবেন?"
                required
              />
              {selectedSeedling && (
                <p className="text-sm text-gray-500">
                  সর্বোচ্চ: {mySeedlings.find(s => s.id === selectedSeedling)?.available} টি
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">বার্তা (ঐচ্ছিক)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="উপহারের সাথে একটি বার্তা লিখুন..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700">
              <Send className="h-4 w-4 mr-2" />
              উপহার পাঠান
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">সাম্প্রতিক প্রাপকগণ</CardTitle>
          <CardDescription>দ্রুত পাঠাতে ক্লিক করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.slice(0, 4).map((member) => (
              <Button
                key={member.id}
                variant="outline"
                className="h-auto p-3 text-left justify-start"
                onClick={() => setSelectedMember(member.id)}
              >
                <User className="h-4 w-4 mr-2" />
                <div>
                  <div className="font-medium">{member.name}</div>
                  <div className="text-xs text-gray-500">{member.location}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendGift;
