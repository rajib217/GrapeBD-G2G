import { useState } from 'react';
import { Users, Leaf, Gift, Bell, Settings, BarChart3, TrendingUp, Package, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import AdminVarieties from '@/components/admin/AdminVarieties';
import AdminGiftRounds from '@/components/admin/AdminGiftRounds';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminNotices from '@/components/admin/AdminNotices';
import AdminGifts from '@/components/admin/AdminGifts';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-full">
                <Settings className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">অ্যাডমিন ড্যাশবোর্ড</h1>
                <p className="text-sm text-muted-foreground">সিস্টেম ম্যানেজমেন্ট প্যানেল</p>
              </div>
            </div>
            <Badge variant="default" className="text-sm">
              <User className="h-3 w-3 mr-1" />
              {profile?.full_name}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>ওভারভিউ</span>
            </TabsTrigger>
            <TabsTrigger value="varieties" className="flex items-center space-x-2">
              <Leaf className="h-4 w-4" />
              <span>জাত</span>
            </TabsTrigger>
            <TabsTrigger value="gift-rounds" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>গিফট রাউন্ড</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>ইউজার</span>
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex items-center space-x-2">
              <Gift className="h-4 w-4" />
              <span>গিফট ম্যানেজ</span>
            </TabsTrigger>
            <TabsTrigger value="notices" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>নোটিশ</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">মোট ইউজার</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">১২৮</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      +১২% গত মাস থেকে
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">মোট জাত</CardTitle>
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">২৪</div>
                    <p className="text-xs text-muted-foreground">
                      +৩ নতুন জাত এই মাসে
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">মোট গিফট</CardTitle>
                    <Gift className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">৫৬৭</div>
                    <p className="text-xs text-muted-foreground">
                      ৪৫ পেন্ডিং অনুমোদনের জন্য
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">অ্যাক্টিভ রাউন্ড</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">৩</div>
                    <p className="text-xs text-muted-foreground">
                      ২ রাউন্ড শীঘ্রই শেষ
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>সাম্প্রতিক গিফট</CardTitle>
                    <CardDescription>শেষ ২৪ ঘন্টার গিফট অ্যাক্টিভিটি</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">রহিম → করিম</p>
                          <p className="text-sm text-muted-foreground">রেড গ্লোব - ২টি চারা</p>
                        </div>
                        <Badge variant="outline">পেন্ডিং</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">সালমা → রাবেয়া</p>
                          <p className="text-sm text-muted-foreground">থম্পসন সিডলেস - ১টি চারা</p>
                        </div>
                        <Badge variant="default">অনুমোদিত</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">জাহিদ → ফারুক</p>
                          <p className="text-sm text-muted-foreground">কিশমিশ - ৩টি চারা</p>
                        </div>
                        <Badge variant="secondary">পাঠানো</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>সিস্টেম স্ট্যাটাস</CardTitle>
                    <CardDescription>বর্তমান সিস্টেমের অবস্থা</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>ডাটাবেজ স্ট্যাটাস</span>
                        <Badge variant="default">সুস্থ</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>অথেন্টিকেশন</span>
                        <Badge variant="default">চালু</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>ইমেইল সিস্টেম</span>
                        <Badge variant="default">চালু</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>ব্যাকআপ স্ট্যাটাস</span>
                        <Badge variant="secondary">সর্বশেষ: ২ ঘন্টা আগে</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="varieties">
            <AdminVarieties />
          </TabsContent>

          <TabsContent value="gift-rounds">
            <AdminGiftRounds />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="gifts">
            <AdminGifts />
          </TabsContent>

          <TabsContent value="notices">
            <AdminNotices />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;