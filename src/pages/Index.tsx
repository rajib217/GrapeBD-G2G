
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Sprout, Users, Gift, MessageCircle, Bell, Plus, UserCheck, Settings } from 'lucide-react';
import SeedlingStock from '@/components/SeedlingStock';
import AddSeedling from '@/components/AddSeedling';
import SendGift from '@/components/SendGift';
import GiftHistory from '@/components/GiftHistory';
import Messages from '@/components/Messages';
import UserNotices from '@/components/UserNotices';
import MyGifts from '@/components/MyGifts';
import AllMembers from '@/components/AllMembers';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleAdminClick = () => {
    if (profile?.role === 'admin') {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-full">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-green-800">চারা ব্যবস্থাপনা</h1>
                <p className="text-sm text-gray-600">আপনার চারা সংগ্রহ এবং গিফট ব্যবস্থাপনা</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-sm text-gray-500">{profile?.email}</p>
              </div>
              {profile?.role === 'admin' && (
                <Button onClick={handleAdminClick} variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  অ্যাডমিন প্যানেল
                </Button>
              )}
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                লগআউট
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-green-700 mb-2">
            স্বাগতম, {profile?.full_name}!
          </h2>
          <p className="text-gray-600">আপনার চারা সংগ্রহ পরিচালনা করুন এবং অন্যদের সাথে গিফট শেয়ার করুন</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="stock" className="flex items-center space-x-2">
              <Sprout className="h-4 w-4" />
              <span>স্টক</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>যোগ করুন</span>
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center space-x-2">
              <Gift className="h-4 w-4" />
              <span>গিফট পাঠান</span>
            </TabsTrigger>
            <TabsTrigger value="my-gifts" className="flex items-center space-x-2">
              <Gift className="h-4 w-4" />
              <span>আমার গিফট</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>মেসেজ</span>
            </TabsTrigger>
            <TabsTrigger value="notices" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>নোটিশ</span>
            </TabsTrigger>
            <TabsTrigger value="all-members" className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4" />
              <span>সকল মেম্বার</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <SeedlingStock />
          </TabsContent>

          <TabsContent value="add">
            <AddSeedling />
          </TabsContent>

          <TabsContent value="send">
            <SendGift />
          </TabsContent>

          <TabsContent value="my-gifts">
            <MyGifts />
          </TabsContent>

          <TabsContent value="messages">
            <Messages />
          </TabsContent>

          <TabsContent value="notices">
            <UserNotices />
          </TabsContent>

          <TabsContent value="all-members">
            <AllMembers />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
