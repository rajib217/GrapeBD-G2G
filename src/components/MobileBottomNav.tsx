import { 
  Sprout, 
  Plus, 
  Gift, 
  MessageSquare, 
  User 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileBottomNav = ({ activeTab, onTabChange }: MobileBottomNavProps) => {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchUnreadCount = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', profile.id)
        .eq('is_read', false);

      if (!error && data) {
        setUnreadCount(data.length);
      }
    };

    fetchUnreadCount();

    // Real-time subscription for unread messages
    const channel = supabase
      .channel('messages-unread')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const quickMenuItems = [
    { id: 'stock', label: 'স্টক', icon: Sprout },
    { id: 'add', label: 'যোগ করুন', icon: Plus },
    { id: 'send', label: 'গিফট', icon: Gift },
    { id: 'messages', label: 'ম্যাসেজ', icon: MessageSquare, badge: unreadCount },
    { id: 'profile', label: 'প্রোফাইল', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 md:hidden z-50 shadow-lg">
      <div className="grid grid-cols-5 safe-area-bottom">
        {quickMenuItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 text-xs transition-all duration-200 touch-target relative ${
                isActive
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700 active:bg-gray-50'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-green-600 rounded-full"></div>
              )}
              <div className="relative">
                <IconComponent className={`h-5 w-5 mb-1 transition-transform ${
                  isActive ? 'text-green-600 scale-110' : ''
                }`} />
                {item.badge && item.badge > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center animate-pulse">
                    {item.badge > 99 ? '99+' : item.badge}
                  </div>
                )}
              </div>
              <span className={`font-medium leading-tight text-center ${
                isActive ? 'text-green-700' : ''
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;