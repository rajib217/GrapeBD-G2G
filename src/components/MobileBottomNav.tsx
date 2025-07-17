import { 
  Sprout, 
  Plus, 
  Gift, 
  History, 
  User 
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileBottomNav = ({ activeTab, onTabChange }: MobileBottomNavProps) => {
  const quickMenuItems = [
    { id: 'stock', label: 'স্টক', icon: Sprout },
    { id: 'add', label: 'যোগ করুন', icon: Plus },
    { id: 'send', label: 'গিফট', icon: Gift },
    { id: 'gift-history', label: 'হিস্টোরি', icon: History },
    { id: 'profile', label: 'প্রোফাইল', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="grid grid-cols-5">
        {quickMenuItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-3 px-2 text-xs transition-colors duration-200 ${
                isActive
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <IconComponent className={`h-6 w-6 mb-1 ${isActive ? 'text-green-600' : ''}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;