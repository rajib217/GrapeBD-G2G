
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, Gift, MessageSquare, Bell, Settings, Home, PlusSquare, Archive, Send, Users, History, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/use-notifications';
import MyGifts from './MyGifts';
import SocialFeed from './SocialFeed';
import UserNotices from './UserNotices';
import Messages from './Messages';
import ProfileEdit from './ProfileEdit';
import AddSeedling from './AddSeedling';
import SeedlingStock from './SeedlingStock';
import SendGift from './SendGift';
import AllMembers from './AllMembers';
import GiftHistory from './GiftHistory';
import AdminUsers from './admin/AdminUsers';
import AdminGifts from './admin/AdminGifts';
import AdminVarieties from './admin/AdminVarieties';
import AdminGiftRounds from './admin/AdminGiftRounds';
import AdminNotices from './admin/AdminNotices';

import MobileNav from './MobileNav';
import MobileBottomNav from './MobileBottomNav';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isAdminView, setIsAdminView] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Initialize notifications
  useNotifications();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const renderContent = () => {
    if (isAdminView) {
      // Admin view content
      switch (activeTab) {
        case 'users':
          return <AdminUsers />;
        case 'gifts':
          return <AdminGifts />;
        case 'varieties':
          return <AdminVarieties />;
        case 'gift-rounds':
          return <AdminGiftRounds />;
        case 'notices':
          return <AdminNotices />;
        case 'messages':
          return <Messages />;
        case 'all-members':
          return <AllMembers />;
        default:
          return <AdminUsers />;
      }
    } else {
      // Normal user view content
      switch (activeTab) {
        case 'home':
          return <SocialFeed />;
        case 'my-gifts':
          return <MyGifts />;
        case 'notices':
          return <UserNotices />;
        case 'messages':
          return <Messages />;
        case 'profile':
          return <ProfileEdit />;
        case 'add-seedling':
          return <AddSeedling />;
        case 'stock':
          return <SeedlingStock />;
        case 'send':
          return <SendGift />;
        case 'all-members':
          return <AllMembers />;
        case 'gift-history':
          return <GiftHistory />;
        default:
          return <SocialFeed />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-64 bg-white border-r">
          <div className="flex items-center justify-center h-20 border-b p-2">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="Grape BD G2G Logo" className="h-12 w-auto" />
              <h1 className="text-2xl font-bold text-blue-600">Grape BD G2G</h1>
            </div>
          </div>
          <div className="flex flex-col flex-grow p-4 space-y-2">
            <Button variant={activeTab === 'feed' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('feed')} className="justify-start">
              <Home className="w-5 h-5 mr-3" />
              ফিড
            </Button>
            <Button variant={activeTab === 'my-gifts' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('my-gifts')} className="justify-start">
              <Gift className="w-5 h-5 mr-3" />
              আমার উপহার
            </Button>
            <Button variant={activeTab === 'add-seedling' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('add-seedling')} className="justify-start">
              <PlusSquare className="w-5 h-5 mr-3" />
              চারাগাছ যোগ করুন
            </Button>
            <Button variant={activeTab === 'seedling-stock' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('seedling-stock')} className="justify-start">
              <Archive className="w-5 h-5 mr-3" />
              চারাগাছের স্টক
            </Button>
            <Button variant={activeTab === 'send-gift' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('send-gift')} className="justify-start">
              <Send className="w-5 h-5 mr-3" />
              উপহার পাঠান
            </Button>
            <Button variant={activeTab === 'all-members' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('all-members')} className="justify-start">
              <Users className="w-5 h-5 mr-3" />
              সকল সদস্য
            </Button>
            <Button variant={activeTab === 'gift-history' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('gift-history')} className="justify-start">
              <History className="w-5 h-5 mr-3" />
              উপহারের ইতিহাস
            </Button>
            <Button variant={activeTab === 'notices' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('notices')} className="justify-start">
              <Bell className="w-5 h-5 mr-3" />
              নোটিশ
            </Button>
            <Button variant={activeTab === 'messages' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('messages')} className="justify-start">
              <MessageSquare className="w-5 h-5 mr-3" />
              মেসেজ
            </Button>
            <Button variant={activeTab === 'profile' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('profile')} className="justify-start">
              <User className="w-5 h-5 mr-3" />
              প্রোফাইল
            </Button>
            {profile?.role === 'admin' && (
              <Button variant={'outline'} onClick={() => navigate('/admin')} className="justify-start">
                <Shield className="w-5 h-5 mr-3" />
                এডমিন প্যানেল
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-grow">
          <div className="flex items-center justify-between h-16 px-4 bg-white border-b md:justify-end">
            <div className="md:hidden">
              <MobileNav 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                isAdminView={isAdminView}
                onAdminViewToggle={setIsAdminView}
              />
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <p className="font-medium hidden md:block">{profile?.full_name}</p>
              <Button variant="outline" size="icon" onClick={() => navigate('/profile')}>
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <main className="p-4 md:p-6">
            {renderContent()}
          </main>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        isAdminView={isAdminView}
        onAdminViewToggle={setIsAdminView}
      />
      
      {/* Add bottom padding for mobile bottom nav */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
};

export default UserDashboard;
