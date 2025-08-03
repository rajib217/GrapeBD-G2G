import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Menu, 
  Sprout, 
  Plus, 
  Gift, 
  History, 
  MessageCircle, 
  Bell, 
  UserCheck, 
  User, 
  LogOut, 
  Settings,
  Home,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SubMenuItem {
  id: string;
  label: string;
  icon: any;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  subItems?: SubMenuItem[];
}

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showAdminButton?: boolean;
}

const MobileNav = ({ activeTab, onTabChange, showAdminButton = false }: MobileNavProps) => {
  const [open, setOpen] = useState(false);
  const [giftMenuOpen, setGiftMenuOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

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

  const handleHomeClick = () => {
    navigate('/');
    setOpen(false);
  };

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
  };

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'হোম', icon: Home },
    { id: 'stock', label: 'স্টক', icon: Sprout },
    { id: 'add', label: 'যোগ করুন', icon: Plus },
    { 
      id: 'gifts', 
      label: 'গিফট ম্যানেজমেন্ট', 
      icon: Gift,
      subItems: [
        { id: 'send', label: 'গিফট পাঠান', icon: Gift },
        { id: 'my-gifts', label: 'আমার গিফট', icon: Gift },
        { id: 'gift-history', label: 'গিফট হিস্টোরি', icon: History },
      ]
    },
    { id: 'messages', label: 'মেসেজ', icon: MessageCircle },
    { id: 'notices', label: 'নোটিশ', icon: Bell },
    { id: 'all-members', label: 'সকল মেম্বার', icon: UserCheck },
    { id: 'profile', label: 'প্রোফাইল', icon: User },
  ];

  const adminMenuItems: MenuItem[] = [
    { id: 'home', label: 'হোম', icon: Home },
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: Settings },
    { id: 'users', label: 'ইউজার', icon: UserCheck },
    { id: 'gifts', label: 'গিফট', icon: Gift },
    { id: 'varieties', label: 'জাত', icon: Sprout },
    { id: 'gift-rounds', label: 'গিফট রাউন্ড', icon: History },
    { id: 'notices', label: 'নোটিশ', icon: Bell },
    { id: 'messages', label: 'মেসেজ', icon: MessageCircle },
    { id: 'all-members', label: 'সকল মেম্বার', icon: UserCheck },
  ];

  const currentMenuItems = showAdminButton ? adminMenuItems : menuItems;

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
              {currentMenuItems.map((item) => {
                const hasSubItems = 'subItems' in item && item.subItems;
                const isParentActive = hasSubItems && item.subItems?.some(sub => sub.id === activeTab);
                const isActive = activeTab === item.id || isParentActive;
                const IconComponent = item.icon;
                
                if (hasSubItems) {
                  return (
                    <Collapsible key={item.id} open={giftMenuOpen} onOpenChange={setGiftMenuOpen}>
                      <CollapsibleTrigger asChild>
                        <button
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                            isActive
                              ? 'bg-green-100 text-green-700 border-l-4 border-green-600'
                              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <IconComponent className={`h-5 w-5 ${isActive ? 'text-green-600' : ''}`} />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          {giftMenuOpen ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-6 space-y-1 mt-1">
                        {item.subItems?.map((subItem) => {
                          const isSubActive = activeTab === subItem.id;
                          const SubIconComponent = subItem.icon;
                          
                          return (
                            <button
                              key={subItem.id}
                              onClick={() => handleTabClick(subItem.id)}
                              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                                isSubActive
                                  ? 'bg-green-50 text-green-600 border-l-2 border-green-500'
                                  : 'hover:bg-gray-50 text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              <SubIconComponent className={`h-4 w-4 ${isSubActive ? 'text-green-500' : ''}`} />
                              <span className="text-sm font-medium">{subItem.label}</span>
                            </button>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }
                
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
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="border-t bg-gray-50 p-3 space-y-2 mt-auto">
            {showAdminButton ? (
              <Button
                onClick={handleHomeClick}
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <Home className="h-4 w-4 mr-2" />
                হোম পেজ
              </Button>
            ) : (
              profile?.role === 'admin' && (
                <Button
                  onClick={handleAdminClick}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  অ্যাডমিন প্যানেল
                </Button>
              )
            )}
            
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