
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, Gift, Leaf, Clock, Bell, MessageCircle, Home, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AdminStats from '@/components/admin/AdminStats';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminGifts from '@/components/admin/AdminGifts';
import AdminVarieties from '@/components/admin/AdminVarieties';
import AdminGiftRounds from '@/components/admin/AdminGiftRounds';
import AdminNotices from '@/components/admin/AdminNotices';
import Messages from '@/components/Messages';
import AllMembers from '@/components/AllMembers';
import NotificationDebug from '@/components/NotificationDebug';
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
    <div className="min-h-screen bg-gradient-subtle">
      {/* Mobile Header */}
      <div className="bg-gradient-primary shadow-lg border-b border-primary/20">
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
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white drop-shadow-md">অ্যাডমিন ড্যাশবোর্ড</h1>
                <p className="text-sm text-white/90 hidden lg:block">সিস্টেম পরিচালনা ও নিয়ন্ত্রণ</p>
              </div>
            </div>
            
            {/* Desktop User Info */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right hidden lg:block">
                <p className="font-medium text-white drop-shadow-md">{profile?.full_name}</p>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">অ্যাডমিন</Badge>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm" variant="outline" size="sm" onClick={handleHomeClick}>
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">হোম পেজ</span>
              </Button>
              <Button onClick={handleSignOut} className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm" variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">লগআউট</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-8 bg-card rounded-2xl p-6 shadow-elegant hover-scale">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            স্বাগতম, {profile?.full_name}!
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">সিস্টেমের সকল কার্যক্রম পরিচালনা করুন</p>
        </div>

        {/* Admin Tabs */}
        <AdminStats />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-4 lg:grid-cols-8 mb-8 h-auto gap-2 bg-card shadow-elegant p-2 rounded-xl">
            <TabsTrigger value="users" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 rounded-lg transition-all data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted">
              <Users className="h-4 w-4" />
              <span className="text-xs md:text-sm font-medium">ইউজার</span>
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 rounded-lg transition-all data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted">
              <Gift className="h-4 w-4" />
              <span className="text-xs md:text-sm font-medium">গিফট</span>
            </TabsTrigger>
            <TabsTrigger value="varieties" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 rounded-lg transition-all data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted">
              <Leaf className="h-4 w-4" />
              <span className="text-xs md:text-sm font-medium">জাত</span>
            </TabsTrigger>
            <TabsTrigger value="gift-rounds" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 rounded-lg transition-all data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted">
              <Clock className="h-4 w-4" />
              <span className="text-xs md:text-sm font-medium">গিফট রাউন্ড</span>
            </TabsTrigger>
            <TabsTrigger value="notices" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 rounded-lg transition-all data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted">
              <Bell className="h-4 w-4" />
              <span className="text-xs md:text-sm font-medium">নোটিশ</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 rounded-lg transition-all data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs md:text-sm font-medium">মেসেজ</span>
            </TabsTrigger>
            <TabsTrigger value="all-members" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 rounded-lg transition-all data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted">
              <UserCheck className="h-4 w-4" />
              <span className="text-xs md:text-sm font-medium">সকল মেম্বার</span>
            </TabsTrigger>
            <TabsTrigger value="notification-debug" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-3 rounded-lg transition-all data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted">
              <Bell className="h-4 w-4" />
              <span className="text-xs md:text-sm font-medium">নোটিফিকেশন ডিবাগ</span>
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

          <TabsContent value="notification-debug">
            <NotificationDebug />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
