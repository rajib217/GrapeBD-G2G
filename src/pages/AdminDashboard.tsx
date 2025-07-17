
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, Gift, Leaf, Clock, Bell, MessageCircle, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminGifts from '@/components/admin/AdminGifts';
import AdminVarieties from '@/components/admin/AdminVarieties';
import AdminGiftRounds from '@/components/admin/AdminGiftRounds';
import AdminNotices from '@/components/admin/AdminNotices';
import Messages from '@/components/Messages';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-full">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-800">অ্যাডমিন ড্যাশবোর্ড</h1>
                <p className="text-sm text-gray-600">সিস্টেম পরিচালনা ও নিয়ন্ত্রণ</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-gray-900">{profile?.full_name}</p>
                <Badge variant="default">অ্যাডমিন</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                হোম পেজ
              </Button>
              <Button onClick={signOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                লগআউট
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-700 mb-2">
            স্বাগতম, {profile?.full_name}!
          </h2>
          <p className="text-gray-600">সিস্টেমের সকল কার্যক্রম পরিচালনা করুন</p>
        </div>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>ইউজার</span>
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex items-center space-x-2">
              <Gift className="h-4 w-4" />
              <span>গিফট</span>
            </TabsTrigger>
            <TabsTrigger value="varieties" className="flex items-center space-x-2">
              <Leaf className="h-4 w-4" />
              <span>জাত</span>
            </TabsTrigger>
            <TabsTrigger value="gift-rounds" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>গিফট রাউন্ড</span>
            </TabsTrigger>
            <TabsTrigger value="notices" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>নোটিশ</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>মেসেজ</span>
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
