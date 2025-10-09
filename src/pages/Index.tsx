
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
    setActiveTab(tab);
    if (tab === 'home') {
      navigate('/');
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Mobile Header */}
      <div className="bg-white/70 backdrop-blur-md shadow-lg border-b sticky top-0 z-40">
        <div className="px-4 py-4">
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
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-full shadow-lg ring-2 ring-emerald-500/10">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">চারা ব্যবস্থাপনা</h1>
                <p className="text-sm text-gray-500 hidden lg:block font-medium">আপনার চারা সংগ্রহ এবং গিফট ব্যবস্থাপনা</p>
              </div>
            </div>
            
            {/* Desktop User Info */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-right hidden lg:block">
                <p className="font-semibold text-gray-800">{profile?.full_name}</p>
                <p className="text-sm text-gray-500">{profile?.email}</p>
              </div>
              {profile?.role === 'admin' && (
                <Button 
                  onClick={handleAdminClick} 
                  variant="outline" 
                  size="sm"
                  className="bg-white/50 hover:bg-white/80 transition-all duration-200 border-emerald-200 hover:border-emerald-300"
                >
                  <Settings className="h-4 w-4 mr-2 text-emerald-600" />
                  <span className="hidden lg:inline">অ্যাডমিন প্যানেল</span>
                </Button>
              )}
              <Button 
                onClick={handleSignOut} 
                variant="outline" 
                size="sm"
                className="bg-white/50 hover:bg-white/80 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">লগআউট</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <div className="mb-6 md:mb-10">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
            স্বাগতম, {profile?.full_name}!
          </h2>
          <p className="text-gray-600 text-sm md:text-base font-medium">আপনার চারা সংগ্রহ পরিচালনা করুন এবং অন্যদের সাথে গিফট শেয়ার করুন</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Desktop Tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-3 lg:grid-cols-10 mb-8 h-auto gap-2 bg-transparent pointer-events-auto">
            <TabsTrigger
              value="home"
              onClick={() => handleTabChange('home')}
              className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 transition-all duration-200 hover:bg-emerald-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg cursor-pointer"
            >
              <Home className="h-4 w-4 pointer-events-none" />
              <span className="text-xs md:text-sm font-medium pointer-events-none">হোম</span>
            </TabsTrigger>
            <TabsTrigger
              value="stock"
              onClick={() => handleTabChange('stock')}
              className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 transition-all duration-200 hover:bg-emerald-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg cursor-pointer"
            >
              <Sprout className="h-4 w-4 pointer-events-none" />
              <span className="text-xs md:text-sm font-medium pointer-events-none">স্টক</span>
            </TabsTrigger>
            <TabsTrigger
              value="add"
              onClick={() => handleTabChange('add')}
              className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 transition-all duration-200 hover:bg-emerald-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg cursor-pointer"
            >
              <Plus className="h-4 w-4 pointer-events-none" />
              <span className="text-xs md:text-sm font-medium pointer-events-none">যোগ করুন</span>
            </TabsTrigger>
            <TabsTrigger
              value="send"
              onClick={() => handleTabChange('send')}
              className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 transition-all duration-200 hover:bg-emerald-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg cursor-pointer"
            >
              <Gift className="h-4 w-4 pointer-events-none" />
              <span className="text-xs md:text-sm font-medium pointer-events-none">গিফট পাঠান</span>
            </TabsTrigger>
            <TabsTrigger
              value="my-gifts"
              onClick={() => handleTabChange('my-gifts')}
              className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 transition-all duration-200 hover:bg-emerald-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg cursor-pointer"
            >
              <Gift className="h-4 w-4 pointer-events-none" />
              <span className="text-xs md:text-sm font-medium pointer-events-none">আমার গিফট</span>
            </TabsTrigger>
            <TabsTrigger
              value="gift-history"
              onClick={() => handleTabChange('gift-history')}
              className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 transition-all duration-200 hover:bg-emerald-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg cursor-pointer"
            >
              <History className="h-4 w-4 pointer-events-none" />
              <span className="text-xs md:text-sm font-medium pointer-events-none">গিফট হিস্টোরি</span>
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              onClick={() => handleTabChange('messages')}
              className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 transition-all duration-200 hover:bg-emerald-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 pointer-events-none" />
              <span className="text-xs md:text-sm font-medium pointer-events-none">মেসেজ</span>
            </TabsTrigger>
            <TabsTrigger
              value="notices"
              onClick={() => handleTabChange('notices')}
              className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 transition-all duration-200 hover:bg-emerald-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg cursor-pointer"
            >
              <Bell className="h-4 w-4 pointer-events-none" />
              <span className="text-xs md:text-sm font-medium pointer-events-none">নোটিশ</span>
            </TabsTrigger>
            <TabsTrigger
              value="all-members"
              onClick={() => handleTabChange('all-members')}
              className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 transition-all duration-200 hover:bg-emerald-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg cursor-pointer"
            >
              <UserCheck className="h-4 w-4 pointer-events-none" />
              <span className="text-xs md:text-sm font-medium pointer-events-none">সকল মেম্বার</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              onClick={() => handleTabChange('profile')}
              className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 transition-all duration-200 hover:bg-emerald-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg cursor-pointer"
            >
              <User className="h-4 w-4 pointer-events-none" />
              <span className="text-xs md:text-sm font-medium pointer-events-none">প্রোফাইল</span>
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
