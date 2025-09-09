import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, MapPin, Package, User, Truck, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  courier_address: string | null;
  profile_image: string | null;
  preferred_courier: string | null;
  bio: string | null;
  g2g_rounds_participated: string[] | null;
  status: string;
  role: string;
  created_at: string;
}

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userVarieties, setUserVarieties] = useState<any[]>([]);
  const [receivedGiftVarieties, setReceivedGiftVarieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setProfile(data);
        
        // Fetch additional data
        await Promise.all([
          fetchUserVarieties(data.id),
          fetchReceivedGiftVarieties(data.id)
        ]);
      } catch (error) {
        toast({
          title: 'ত্রুটি',
          description: 'প্রোফাইল লোড করতে সমস্যা হয়েছে',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchUserVarieties = async (profileId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_varieties')
          .select(`
            id,
            variety_id,
            notes,
            varieties(name, thumbnail_image)
          `)
          .eq('user_id', profileId);
        
        if (error) throw error;
        setUserVarieties(data || []);
      } catch (error) {
        console.error('Error fetching user varieties:', error);
      }
    };

    const fetchReceivedGiftVarieties = async (profileId: string) => {
      try {
        const { data, error } = await supabase
          .rpc('get_user_received_gift_varieties', { profile_id: profileId });
        
        if (error) throw error;
        setReceivedGiftVarieties(data || []);
      } catch (error) {
        console.error('Error fetching received gift varieties:', error);
      }
    };

    fetchProfile();
  }, [userId, toast]);

  if (loading) {
    return <div className="text-center py-8">লোড হচ্ছে...</div>;
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p>প্রোফাইল পাওয়া যায়নি</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          ফিরে যান
        </Button>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">অ্যাডমিন</Badge>;
      case 'moderator':
        return <Badge variant="secondary">মডারেটর</Badge>;
      default:
        return <Badge variant="outline">সদস্য</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">সক্রিয়</Badge>;
      case 'inactive':
        return <Badge variant="secondary">নিষ্ক্রিয়</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            onClick={() => navigate('/')} 
            variant="outline" 
            size="sm"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ফিরে যান
          </Button>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">মূল তথ্য</TabsTrigger>
            <TabsTrigger value="varieties">ব্যক্তিগত জাত</TabsTrigger>
            <TabsTrigger value="gifts">প্রাপ্ত গিফট</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.profile_image || ''} />
                    <AvatarFallback className="text-2xl">
                      {profile.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                <div className="flex justify-center space-x-2 mt-2">
                  {getRoleBadge(profile.role)}
                  {getStatusBadge(profile.status)}
                </div>
                
                {/* Contact Actions */}
                <div className="flex justify-center space-x-2 mt-4">
                  {profile.phone && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      asChild
                    >
                      <a href={`tel:${profile.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        কল করুন
                      </a>
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    onClick={() => navigate(`/messages?userId=${profile.id}`)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    মেসেজ করুন
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {profile.bio && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">সংক্ষিপ্ত বিবরণ:</h4>
                    <p className="text-sm">{profile.bio}</p>
                  </div>
                )}

                {profile.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span>{profile.email}</span>
                  </div>
                )}
                
                {profile.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                
                {profile.courier_address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span>{profile.courier_address}</span>
                  </div>
                )}

                {profile.preferred_courier && (
                  <div className="flex items-center space-x-3">
                    <Truck className="h-5 w-5 text-gray-500" />
                    <span>পছন্দের কুরিয়ার: {profile.preferred_courier}</span>
                  </div>
                )}

                {profile.g2g_rounds_participated && profile.g2g_rounds_participated.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">G2G রাউন্ডে অংশগ্রহণ:</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.g2g_rounds_participated.map((round, index) => (
                        <Badge key={index} variant="outline">
                          {round}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-sm text-gray-500 mt-4">
                  যোগদানের তারিখ: {new Date(profile.created_at).toLocaleDateString('bn-BD', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Varieties Tab */}
          <TabsContent value="varieties">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>{profile.full_name} এর ব্যক্তিগত জাত সমূহ</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userVarieties.map((userVariety) => (
                    <div key={userVariety.id} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        {userVariety.varieties?.thumbnail_image && (
                          <img 
                            src={userVariety.varieties.thumbnail_image} 
                            alt={userVariety.varieties?.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h4 className="font-medium">{userVariety.varieties?.name}</h4>
                          {userVariety.notes && (
                            <p className="text-sm text-muted-foreground">{userVariety.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {userVarieties.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    এখনো কোন জাত যোগ করা হয়নি
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Received Gift Varieties Tab */}
          <TabsContent value="gifts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>{profile.full_name} এর G2G থেকে প্রাপ্ত জাত</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {receivedGiftVarieties.map((giftVariety) => (
                    <div key={giftVariety.variety_id} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        {giftVariety.variety_thumbnail && (
                          <img 
                            src={giftVariety.variety_thumbnail} 
                            alt={giftVariety.variety_name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{giftVariety.variety_name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary">
                              {giftVariety.gift_count}টি গিফট
                            </Badge>
                          </div>
                          {giftVariety.latest_gift_date && (
                            <p className="text-sm text-muted-foreground mt-1">
                              সর্বশেষ: {new Date(giftVariety.latest_gift_date).toLocaleDateString('bn-BD')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {receivedGiftVarieties.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    এখনো কোন গিফট পাননি
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;