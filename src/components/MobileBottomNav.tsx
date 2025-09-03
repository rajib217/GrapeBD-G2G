import { 
  Sprout, 
  Gift, 
  MessageSquare, 
  User,
  Home
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

const MobileBottomNav = ({ activeTab, onTabChange }: MobileBottomNavProps) => {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', profile.id)
        .eq('is_read', false);

      if (!error && data) {
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const navItems: NavItem[] = [
    { id: 'home', label: 'হোম', icon: Home },
    { id: 'stock', label: 'স্টক', icon: Sprout },
    { id: 'send', label: 'গিফট', icon: Gift },
    { 
      id: 'messages', 
      label: 'ম্যাসেজ', 
      icon: MessageSquare, 
      badge: unreadCount > 0 ? unreadCount : undefined 
    },
    { id: 'profile', label: 'প্রোফাইল', icon: User },
  ];

  const handleTabClick = useCallback((tabId: string) => {
    onTabChange(tabId);
  }, [onTabChange]);

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border md:hidden z-50 shadow-lg"
      role="navigation"
      aria-label="মোবাইল নেভিগেশন"
    >
      <div className="grid grid-cols-5 px-2 py-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`
                relative flex flex-col items-center justify-center 
                py-2 px-1 rounded-lg text-xs font-medium
                transition-all duration-200 ease-in-out
                touch-target min-h-[60px]
                ${isActive 
                  ? 'text-primary bg-accent/50' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/30 active:bg-accent/40'
                }
              `}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
              )}
              
              {/* Icon with badge */}
              <div className="relative mb-1">
                <IconComponent 
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                />
                {item.badge && item.badge > 0 && (
                  <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center border border-background shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </div>
                )}
              </div>
              
              {/* Label */}
              <span className="leading-tight text-center truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
};

export default MobileBottomNav;