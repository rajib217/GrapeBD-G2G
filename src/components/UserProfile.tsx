import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, MoreHorizontal } from 'lucide-react';
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

interface Post {
  id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    profile_image: string | null;
  };
}

interface UserVariety {
  id: string;
  variety_id: string;
  notes: string | null;
  varieties: {
    name: string;
    thumbnail_image: string | null;
  };
}

interface ReceivedGiftVariety {
  variety_id: string;
  variety_name: string;
  variety_thumbnail: string | null;
  gift_count: number;
  latest_gift_date: string;
}

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userVarieties, setUserVarieties] = useState<UserVariety[]>([]);
  const [receivedGiftVarieties, setReceivedGiftVarieties] = useState<ReceivedGiftVariety[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const formatPostDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInMinutes < 1) return 'এইমাত্র';
      if (diffInMinutes < 60) return `${diffInMinutes} মিনিট আগে`;
      if (diffInHours < 24) return `${diffInHours} ঘন্টা আগে`;
      if (diffInDays < 7) return `${diffInDays} দিন আগে`;
      
      return date.toLocaleDateString('bn-BD');
    } catch {
      return 'সময় অজানা';
    }
  };

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
        
        // Fetch all user data
        await Promise.all([
          fetchUserPosts(data.id),
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

    const fetchUserPosts = async (profileId: string) => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            image_url,
            created_at,
            profiles:user_id (
              id,
              full_name,
              profile_image
            )
          `)
          .eq('user_id', profileId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching user posts:', error);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Photo */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
        <Button 
          onClick={() => navigate(-1)} 
          variant="ghost" 
          size="sm"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          ফিরে যান
        </Button>
      </div>

      {/* Profile Header */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="relative -mt-16 md:-mt-20 mb-4">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background">
              <AvatarImage src={profile.profile_image || ''} />
              <AvatarFallback className="text-4xl">
                {profile.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left mb-4">
              <h1 className="text-2xl md:text-3xl font-bold">{profile.full_name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                {getRoleBadge(profile.role)}
                {profile.status === 'active' && <Badge variant="default">সক্রিয়</Badge>}
              </div>
              {profile.bio && (
                <p className="text-muted-foreground mt-2 max-w-2xl">{profile.bio}</p>
              )}
            </div>

            <div className="flex gap-2">
              {profile.phone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${profile.phone}`}>
                    <Phone className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">কল করুন</span>
                  </a>
                </Button>
              )}
              <Button size="sm" onClick={() => navigate(`/messages?userId=${profile.id}`)}>
                <MessageCircle className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">মেসেজ</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="posts" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              পোস্ট
            </TabsTrigger>
            <TabsTrigger 
              value="about" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              পরিচিতি
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-4">
            <div className="grid md:grid-cols-5 gap-4">
              {/* Left Sidebar - About */}
              <Card className="md:col-span-2 h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">পরিচিতি</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile.courier_address && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.courier_address}</span>
                    </div>
                  )}
                  {profile.g2g_rounds_participated && profile.g2g_rounds_participated.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium mb-2">G2G রাউন্ড</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.g2g_rounds_participated.map((round, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {round}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Main Content - Posts */}
              <div className="md:col-span-3 space-y-4">
                {posts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <p className="text-muted-foreground">এখনো কোন পোস্ট নেই</p>
                    </CardContent>
                  </Card>
                ) : (
                  posts.map((post) => (
                    <Card key={post.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={post.profiles.profile_image || ''} />
                              <AvatarFallback>
                                {post.profiles.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">{post.profiles.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatPostDate(post.created_at)}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {post.content && (
                          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                        )}
                        {post.image_url && (
                          <img 
                            src={post.image_url} 
                            alt="Post" 
                            className="w-full rounded-lg"
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>বিস্তারিত তথ্য</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">যোগাযোগ</h3>
                    <div className="space-y-2">
                      {profile.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{profile.email}</span>
                        </div>
                      )}
                      {profile.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{profile.phone}</span>
                        </div>
                      )}
                      {profile.courier_address && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{profile.courier_address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">অন্যান্য</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">যোগদান: </span>
                        {new Date(profile.created_at).toLocaleDateString('bn-BD', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      {profile.preferred_courier && (
                        <p>
                          <span className="text-muted-foreground">পছন্দের কুরিয়ার: </span>
                          {profile.preferred_courier}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {profile.bio && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">পরিচিতি</h3>
                    <p className="text-sm">{profile.bio}</p>
                  </div>
                )}

                {profile.g2g_rounds_participated && profile.g2g_rounds_participated.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">G2G রাউন্ডে অংশগ্রহণ</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.g2g_rounds_participated.map((round, index) => (
                        <Badge key={index} variant="outline">
                          {round}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Varieties Section */}
                {userVarieties.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">ব্যক্তিগত জাত সমূহ</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {userVarieties.map((userVariety) => (
                        <div key={userVariety.id} className="border rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            {userVariety.varieties?.thumbnail_image && (
                              <img 
                                src={userVariety.varieties.thumbnail_image} 
                                alt={userVariety.varieties?.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{userVariety.varieties?.name}</h4>
                              {userVariety.notes && (
                                <p className="text-xs text-muted-foreground mt-1">{userVariety.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Received Gift Varieties Section */}
                {receivedGiftVarieties.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">G2G থেকে প্রাপ্ত জাত</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {receivedGiftVarieties.map((giftVariety) => (
                        <div key={giftVariety.variety_id} className="border rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            {giftVariety.variety_thumbnail && (
                              <img 
                                src={giftVariety.variety_thumbnail} 
                                alt={giftVariety.variety_name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{giftVariety.variety_name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {giftVariety.gift_count}টি গিফট
                                </Badge>
                              </div>
                              {giftVariety.latest_gift_date && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  সর্বশেষ: {new Date(giftVariety.latest_gift_date).toLocaleDateString('bn-BD')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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