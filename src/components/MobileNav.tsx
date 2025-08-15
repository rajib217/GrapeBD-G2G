import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Menu, 
  Home,
  Gift,
  PlusSquare,
  Archive,
  Send,
  Users,
  History,
  Bell,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Shield
} from 'lucide-react';

import { Leaf, Clock, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
}

  import { ChevronDown, ChevronUp } from 'lucide-react';
interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileNav = ({ activeTab, onTabChange }: MobileNavProps) => {
  const [open, setOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showAdminItems, setShowAdminItems] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleAdminClick = () => {
    if (profile?.role === 'admin') {
      navigate('/admin');
      setOpen(false);
    }
  };

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
  };

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'হোম', icon: Home },
    { id: 'my-gifts', label: 'আমার উপহার', icon: Gift },
    { id: 'add-seedling', label: 'চারাগাছ যোগ করুন', icon: PlusSquare },
    { id: 'seedling-stock', label: 'চারাগাছের স্টক', icon: Archive },
    { id: 'send-gift', label: 'উপহার পাঠান', icon: Send },
    { id: 'all-members', label: 'সকল সদস্য', icon: Users },
    { id: 'gift-history', label: 'উপহারের ইতিহাস', icon: History },
    { id: 'notices', label: 'নোটিশ', icon: Bell },
    { id: 'messages', label: 'মেসেজ', icon: MessageSquare },
    { id: 'profile', label: 'প্রোফাইল', icon: User },
  ];

  // Admin-specific menu items (shown for admins)
  const adminMenuItems: MenuItem[] = profile?.role === 'admin'
    ? [
        { id: 'users', label: 'ইউজার', icon: Users },
        { id: 'gifts', label: 'গিফট', icon: Gift },
        { id: 'varieties', label: 'জাত', icon: Leaf },
        { id: 'gift-rounds', label: 'গিফট রাউন্ড', icon: Clock },
        { id: 'notices', label: 'নোটিশ', icon: Bell },
        { id: 'messages', label: 'মেসেজ', icon: MessageSquare },
        { id: 'all-members', label: 'সকল মেম্বার', icon: UserCheck },
      ]
    : [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-green-600 to-blue-600">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-16 w-16 ring-2 ring-white">
                <AvatarImage src={profile?.profile_image || ''} />
                <AvatarFallback className="bg-white text-green-600 text-xl font-bold">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="font-bold text-lg">{profile?.full_name}</p>
                <p className="text-green-100 text-sm">{profile?.email}</p>
                {profile?.role === 'admin' && (
                  <Badge variant="secondary" className="mt-1">অ্যাডমিন</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 py-4 overflow-y-auto">
            <nav className="space-y-1 px-3">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-green-100 text-green-700 border-l-4 border-green-600'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className={`h-5 w-5 ${isActive ? 'text-green-600' : ''}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}

              {/* Admin toggle for mobile */}
              {profile?.role === 'admin' && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowAdminItems(s => !s)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 text-gray-600"
                  >
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">অ্যাডমিন প্যানেল</span>
                    </div>
                    {showAdminItems ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {showAdminItems && (
                    <div className="mt-2 space-y-1">
                      {adminMenuItems.map((item) => {
                        const isActive = activeTab === item.id;
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => { navigate('/admin'); onTabChange(item.id); setOpen(false); }}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                              isActive
                                ? 'bg-green-100 text-green-700 border-l-4 border-green-600'
                                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <IconComponent className={`h-5 w-5 ${isActive ? 'text-green-600' : ''}`} />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="border-t bg-gray-50 p-3 space-y-2 mt-auto">
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full justify-start"
              size="sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              লগআউট
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;