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
              <IconComponent className={`h-5 w-5 mb-1 transition-transform ${
                isActive ? 'text-green-600 scale-110' : ''
              }`} />
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