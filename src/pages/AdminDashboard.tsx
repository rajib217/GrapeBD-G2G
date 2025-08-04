
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, Gift, Leaf, Clock, Bell, MessageCircle, Home, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminGifts from '@/components/admin/AdminGifts';
import AdminVarieties from '@/components/admin/AdminVarieties';
import AdminGiftRounds from '@/components/admin/AdminGiftRounds';
import AdminNotices from '@/components/admin/AdminNotices';
import Messages from '@/components/Messages';
import AllMembers from '@/components/AllMembers';
import MobileNav from '@/components/MobileNav';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleHomeClick = () => {
    navigate('/dashboard');
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'home') {
      navigate('/');
    } else if (tab === 'dashboard') {
      navigate('/dashboard');
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b">
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
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-full">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-blue-800">অ্যাডমিন ড্যাশবোর্ড</h1>
                <p className="text-sm text-gray-600 hidden lg:block">সিস্টেম পরিচালনা ও নিয়ন্ত্রণ</p>
              </div>
            </div>
            
            {/* Desktop User Info */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right hidden lg:block">
                <p className="font-medium text-gray-900">{profile?.full_name}</p>
                <Badge variant="default">অ্যাডমিন</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleHomeClick}>
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">হোম পেজ</span>
              </Button>
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
          <h2 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">
            স্বাগতম, {profile?.full_name}!
          </h2>
          <p className="text-gray-600 text-sm md:text-base">সিস্টেমের সকল কার্যক্রম পরিচালনা করুন</p>
        </div>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-3 lg:grid-cols-7 mb-8 h-auto gap-2 bg-transparent">
            <TabsTrigger value="users" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <Users className="h-4 w-4" />
              <span className="text-xs md:text-sm">ইউজার</span>
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <Gift className="h-4 w-4" />
              <span className="text-xs md:text-sm">গিফট</span>
            </TabsTrigger>
            <TabsTrigger value="varieties" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <Leaf className="h-4 w-4" />
              <span className="text-xs md:text-sm">জাত</span>
            </TabsTrigger>
            <TabsTrigger value="gift-rounds" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <Clock className="h-4 w-4" />
              <span className="text-xs md:text-sm">গিফট রাউন্ড</span>
            </TabsTrigger>
            <TabsTrigger value="notices" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <Bell className="h-4 w-4" />
              <span className="text-xs md:text-sm">নোটিশ</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs md:text-sm">মেসেজ</span>
            </TabsTrigger>
            <TabsTrigger value="all-members" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <UserCheck className="h-4 w-4" />
              <span className="text-xs md:text-sm">সকল মেম্বার</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="gifts">
            <AdminGifts />
          </TabsContent>

          <TabsContent value="varieties">
            <AdminVarieties />
          </TabsContent>

          <TabsContent value="gift-rounds">
            <AdminGiftRounds />
          </TabsContent>

          <TabsContent value="notices">
            <AdminNotices />
          </TabsContent>

          <TabsContent value="messages">
            <Messages />
          </TabsContent>

          <TabsContent value="all-members">
            <AllMembers />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
