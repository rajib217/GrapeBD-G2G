import { useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  LogOut,
  Shield,
  Leaf, 
  Clock, 
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdminView?: boolean;
  onViewChange?: (isAdmin: boolean) => void;
}

const MobileNav = ({ 
  activeTab, 
  onTabChange, 
  isAdminView = false, 
  onViewChange 
}: MobileNavProps) => {
  const [open, setOpen] = useState(false);
  const { profile, signOut } = useAuth();

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [signOut]);

  const handleAdminClick = useCallback(() => {
    if (profile?.role === 'admin' && onViewChange) {
      onViewChange(true);
      setOpen(false);
    }
  }, [profile?.role, onViewChange]);

  const handleHomeClick = useCallback(() => {
    if (onViewChange) {
      onViewChange(false);
      setOpen(false);
    }
  }, [onViewChange]);

  const handleTabClick = useCallback((tab: string) => {
    onTabChange(tab);
    setOpen(false);
  }, [onTabChange]);

  const menuItems: MenuItem[] = isAdminView ? [
    { id: 'users', label: 'ইউজার', icon: Users },
    { id: 'gifts', label: 'গিফট', icon: Gift },
    { id: 'varieties', label: 'জাত', icon: Leaf },
    { id: 'gift-rounds', label: 'গিফট রাউন্ড', icon: Clock },
    { id: 'notices', label: 'নোটিশ', icon: Bell },
    { id: 'all-members', label: 'সকল মেম্বার', icon: UserCheck },
  ] : [
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

  // Debug logging
  console.log('MobileNav - isAdminView:', isAdminView);
  console.log('MobileNav - Profile Role:', profile?.role);
  console.log('MobileNav - Menu Items Count:', menuItems.length);
  console.log('MobileNav - Menu Items:', menuItems.map(item => item.label));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          aria-label="মেনু খুলুন"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-80 p-0 bg-background">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 bg-primary text-primary-foreground">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-14 w-14 ring-2 ring-primary-foreground/20">
                <AvatarImage src={profile?.profile_image || ''} />
                <AvatarFallback className="bg-primary-foreground text-primary text-lg font-bold">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg truncate">
                  {profile?.full_name || 'ব্যবহারকারী'}
                </p>
                <p className="text-primary-foreground/80 text-sm truncate">
                  {profile?.email}
                </p>
                {profile?.role === 'admin' && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    অ্যাডমিন
                  </Badge>
                )}
              </div>
            </div>
            
            {/* View Toggle Buttons for Admin */}
            {profile?.role === 'admin' && (
              <>
                <Separator className="my-3 bg-primary-foreground/20" />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={!isAdminView ? "secondary" : "outline"}
                    size="sm"
                    onClick={handleHomeClick}
                    className="flex items-center justify-center"
                  >
                    <Home className="h-4 w-4 mr-1" />
                    হোম
                  </Button>
                  <Button
                    variant={isAdminView ? "secondary" : "outline"}
                    size="sm"
                    onClick={handleAdminClick}
                    className="flex items-center justify-center"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    অ্যাডমিন
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 py-2 overflow-y-auto scroll-container">
            <nav className="px-2" role="navigation">
              {/* Debug Info */}
              <div className="mb-2 p-2 bg-muted/20 rounded text-xs">
                <p>Admin View: {isAdminView ? 'হ্যাঁ' : 'না'}</p>
                <p>Menu Items: {menuItems.length}</p>
              </div>
              
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 
                        rounded-lg text-left transition-all duration-200 
                        touch-target group
                        ${isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }
                      `}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <IconComponent 
                        className={`h-5 w-5 flex-shrink-0 transition-colors ${
                          isActive ? 'text-primary-foreground' : 'group-hover:text-foreground'
                        }`} 
                      />
                      <span className="font-medium truncate">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-border bg-muted/30 p-3">
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full justify-start touch-target"
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