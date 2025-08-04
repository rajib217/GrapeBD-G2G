
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Sprout, Users, Gift, MessageCircle, Bell, Plus, UserCheck, Settings, User, History, Home } from 'lucide-react';
import SeedlingStock from '@/components/SeedlingStock';
import AddSeedling from '@/components/AddSeedling';
import SendGift from '@/components/SendGift';
import GiftHistory from '@/components/GiftHistory';
import Messages from '@/components/Messages';
import UserNotices from '@/components/UserNotices';
import MyGifts from '@/components/MyGifts';
import AllMembers from '@/components/AllMembers';
import ProfileEdit from '@/components/ProfileEdit';
import SocialFeed from '@/components/SocialFeed';
import MobileNav from '@/components/MobileNav';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (tab: string) => {
    if (tab === 'home') {
      navigate('/');
    } else {
      setActiveTab(tab);
    }
  };

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
      {/* Mobile Header */}
      <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile Menu */}
            <div className="md:hidden">
              <MobileNav 
                activeTab={activeTab} 
                onTabChange={handleTabChange}
              />
            </div>
            
            {/* Logo and Title */}
            <div className="flex items-center space-x-3 flex-1 justify-center md:justify-start">
              <div className="bg-gradient-to-br from-green-600 to-green-700 p-2 rounded-full shadow-md">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-green-800">চারা ব্যবস্থাপনা</h1>
                <p className="text-sm text-gray-600 hidden lg:block">আপনার চারা সংগ্রহ এবং গিফট ব্যবস্থাপনা</p>
              </div>
            </div>
            
            {/* Desktop User Info */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right hidden lg:block">
                <p className="font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-sm text-gray-500">{profile?.email}</p>
              </div>
              {profile?.role === 'admin' && (
                <Button onClick={handleAdminClick} variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">অ্যাডমিন প্যানেল</span>
                </Button>
              )}
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">লগআউট</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-2">
            স্বাগতম, {profile?.full_name}!
          </h2>
          <p className="text-gray-600 text-sm md:text-base">আপনার চারা সংগ্রহ পরিচালনা করুন এবং অন্যদের সাথে গিফট শেয়ার করুন</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-3 lg:grid-cols-10 mb-8 h-auto gap-2 bg-transparent">
            <TabsTrigger value="home" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Home className="h-4 w-4" />
              <span className="text-xs md:text-sm">হোম</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Sprout className="h-4 w-4" />
              <span className="text-xs md:text-sm">স্টক</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Plus className="h-4 w-4" />
              <span className="text-xs md:text-sm">যোগ করুন</span>
            </TabsTrigger>
            <TabsTrigger value="send" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Gift className="h-4 w-4" />
              <span className="text-xs md:text-sm">গিফট পাঠান</span>
            </TabsTrigger>
            <TabsTrigger value="my-gifts" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Gift className="h-4 w-4" />
              <span className="text-xs md:text-sm">আমার গিফট</span>
            </TabsTrigger>
            <TabsTrigger value="gift-history" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <History className="h-4 w-4" />
              <span className="text-xs md:text-sm">গিফট হিস্টোরি</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs md:text-sm">মেসেজ</span>
            </TabsTrigger>
            <TabsTrigger value="notices" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Bell className="h-4 w-4" />
              <span className="text-xs md:text-sm">নোটিশ</span>
            </TabsTrigger>
            <TabsTrigger value="all-members" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <UserCheck className="h-4 w-4" />
              <span className="text-xs md:text-sm">সকল মেম্বার</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <User className="h-4 w-4" />
              <span className="text-xs md:text-sm">প্রোফাইল</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <SocialFeed />
          </TabsContent>

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

          <TabsContent value="gift-history">
            <GiftHistory />
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

          <TabsContent value="profile">
            <ProfileEdit />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* Add bottom padding for mobile bottom nav */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
};

export default Index;
