
import { useState } from 'react';
import { Plus, Gift, Leaf, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SeedlingStock from '@/components/SeedlingStock';
import SendGift from '@/components/SendGift';
import GiftHistory from '@/components/GiftHistory';
import AddSeedling from '@/components/AddSeedling';

const Index = () => {
  const [activeTab, setActiveTab] = useState('stock');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-green-800">চারা গিফট সেন্টার</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>সদস্য: জন ডো</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-green-700 mb-2">আপনার চারা ড্যাশবোর্ড</h2>
          <p className="text-gray-600">আপনার চারার স্টক দেখুন, নতুন চারা যোগ করুন এবং বন্ধুদের কাছে উপহার পাঠান</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">মোট চারা</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">২৪</div>
              <p className="text-green-100 text-sm">বিভিন্ন জাতের</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">পাঠানো উপহার</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">৮</div>
              <p className="text-blue-100 text-sm">এই মাসে</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">পাওয়া উপহার</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">৫</div>
              <p className="text-purple-100 text-sm">এই মাসে</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="stock" className="flex items-center space-x-2">
              <Leaf className="h-4 w-4" />
              <span>আমার স্টক</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>চারা যোগ করুন</span>
            </TabsTrigger>
            <TabsTrigger value="gift" className="flex items-center space-x-2">
              <Gift className="h-4 w-4" />
              <span>উপহার পাঠান</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>ইতিহাস</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <SeedlingStock />
          </TabsContent>

          <TabsContent value="add">
            <AddSeedling />
          </TabsContent>

          <TabsContent value="gift">
            <SendGift />
          </TabsContent>

          <TabsContent value="history">
            <GiftHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
