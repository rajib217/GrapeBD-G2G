import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Save, Upload, Plus, X, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageCompression';

const ProfileEdit = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    courier_address: '',
    profile_image: '',
    preferred_courier: '',
    bio: '',
    g2g_rounds: ''
  });
  const [varieties, setVarieties] = useState<any[]>([]);
  const [userVarieties, setUserVarieties] = useState<any[]>([]);
  const [receivedGiftVarieties, setReceivedGiftVarieties] = useState<any[]>([]);
  const [selectedVarietyId, setSelectedVarietyId] = useState('');
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        courier_address: profile.courier_address || '',
        profile_image: profile.profile_image || '',
        preferred_courier: profile.preferred_courier || '',
        bio: profile.bio || '',
        g2g_rounds: Array.isArray(profile.g2g_rounds_participated)
          ? profile.g2g_rounds_participated.join(', ')
          : ''
      });
    }
    fetchVarieties();
    fetchUserVarieties();
    fetchReceivedGiftVarieties();
  }, [profile]);

  const fetchVarieties = async () => {
    try {
      const { data, error } = await supabase
        .from('varieties')
        .select('id, name, thumbnail_image')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVarieties(data || []);
    } catch (error) {
      console.error('Error fetching varieties:', error);
    }
  };

  const fetchUserVarieties = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_varieties')
        .select(`
          id,
          variety_id,
          notes,
          varieties(name, thumbnail_image)
        `)
        .eq('user_id', profile.id);

      if (error) throw error;
      setUserVarieties(data || []);
    } catch (error) {
      console.error('Error fetching user varieties:', error);
    }
  };

  const fetchReceivedGiftVarieties = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_received_gift_varieties', { profile_id: profile.id });

      if (error) throw error;
      setReceivedGiftVarieties(data || []);
    } catch (error) {
      console.error('Error fetching received gift varieties:', error);
    }
  };

  // Generate Gravatar URL
  const getGravatarUrl = (email: string) => {
    if (!email) return '';
    const hash = btoa(email.toLowerCase().trim()).replace(/[^a-zA-Z0-9]/g, '');
    return `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setLoading(true);
    try {
      const g2gRoundsArray = formData.g2g_rounds
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          courier_address: formData.courier_address,
          profile_image: formData.profile_image,
          preferred_courier: formData.preferred_courier,
          bio: formData.bio,
          g2g_rounds_participated: g2gRoundsArray,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'সফল',
        description: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে',
      });

      // Refresh profile data
      await refreshProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'ত্রুটি',
        description: 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'ত্রুটি',
        description: 'শুধুমাত্র ছবি ফাইল আপলোড করুন',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const compressedFile = await compressImage(file, 10);

      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${profile.user_id}.${fileExt}`;
      const filePath = `${profile.user_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, compressedFile, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      handleInputChange('profile_image', data.publicUrl);

      toast({
        title: 'সফল',
        description: 'প্রোফাইল ছবি আপলোড হয়েছে',
      });

      // Refresh profile data to reflect changes immediately
      await refreshProfile();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'ত্রুটি',
        description: 'ছবি আপলোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const addUserVariety = async () => {
    if (!selectedVarietyId || !profile?.id) return;

    try {
      const { error } = await supabase
        .from('user_varieties')
        .insert({
          user_id: profile.id,
          variety_id: selectedVarietyId
        });

      if (error) throw error;

      toast({
        title: 'সফল',
        description: 'জাত যোগ করা হয়েছে',
      });

      setSelectedVarietyId('');
      fetchUserVarieties();
    } catch (error) {
      console.error('Error adding variety:', error);
      toast({
        title: 'ত্রুটি',
        description: 'জাত যোগ করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    }
  };

  const removeUserVariety = async (userVarietyId: string) => {
    try {
      const { error } = await supabase
        .from('user_varieties')
        .delete()
        .eq('id', userVarietyId);

      if (error) throw error;

      toast({
        title: 'সফল',
        description: 'জাত সরানো হয়েছে',
      });

      fetchUserVarieties();
    } catch (error) {
      console.error('Error removing variety:', error);
      toast({
        title: 'ত্রুটি',
        description: 'জাত সরাতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    }
  };

  const profileImageUrl = formData.profile_image || 
    (formData.email ? getGravatarUrl(formData.email) : '');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">মূল তথ্য</TabsTrigger>
          <TabsTrigger value="varieties">আমার জাত</TabsTrigger>
          <TabsTrigger value="gifts">প্রাপ্ত গিফট</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>প্রোফাইল সম্পাদনা</span>
              </CardTitle>
              <CardDescription>
                আপনার ব্যক্তিগত তথ্য আপডেট করুন
              </CardDescription>
            </CardHeader>
            <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileImageUrl} alt="Profile" />
                <AvatarFallback className="text-lg">
                  {formData.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">ছবি আপলোড</TabsTrigger>
                  <TabsTrigger value="url">URL লিংক</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-4">
                  <div>
                    <Label htmlFor="file_upload">ছবি ফাইল নির্বাচন করুন</Label>
                    <Input
                      id="file_upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      সর্বোচ্চ ১০কেবি সাইজের ছবি আপলোড করুন
                    </p>
                    {uploading && (
                      <p className="text-sm text-blue-600 mt-2">
                        ছবি আপলোড হচ্ছে...
                      </p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="url" className="space-y-4">
                  <div>
                    <Label htmlFor="profile_image">প্রোফাইল ছবি URL</Label>
                    <Input
                      id="profile_image"
                      type="url"
                      value={formData.profile_image}
                      onChange={(e) => handleInputChange('profile_image', e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      ইমেইলে Gravatar থাকলে স্বয়ংক্রিয়ভাবে দেখাবে
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Full Name */}
            <div>
              <Label htmlFor="full_name">পূর্ণ নাম *</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">ইমেইল</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">মোবাইল নম্বর</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="০১৭xxxxxxxx"
              />
            </div>

            {/* Courier Address */}
            <div>
              <Label htmlFor="courier_address">কুরিয়ার ঠিকানা</Label>
              <Textarea
                id="courier_address"
                value={formData.courier_address}
                onChange={(e) => handleInputChange('courier_address', e.target.value)}
                placeholder="আপনার সম্পূর্ণ ঠিকানা লিখুন"
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-1">
                গিফট পাঠানোর জন্য এই ঠিকানা ব্যবহার হবে
              </p>
            </div>

            {/* Preferred Courier */}
            <div>
              <Label htmlFor="preferred_courier">পছন্দের কুরিয়ার</Label>
              <Select 
                value={formData.preferred_courier} 
                onValueChange={(value) => handleInputChange('preferred_courier', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="কুরিয়ার নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="steadfast">Steadfast</SelectItem>
                  <SelectItem value="pathao">Pathao</SelectItem>
                  <SelectItem value="redx">RedX</SelectItem>
                  <SelectItem value="sundarban">Sundarban</SelectItem>
                  <SelectItem value="sa_paribahan">SA Paribahan</SelectItem>
                  <SelectItem value="other">অন্যান্য</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">সংক্ষিপ্ত বিবরণ</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="আপনার সম্পর্কে কিছু লিখুন..."
                rows={3}
              />
            </div>

            {/* G2G Rounds Participated */}
            <div>
              <Label htmlFor="g2g_rounds">G2G রাউন্ডে অংশগ্রহণ</Label>
              <Input
                id="g2g_rounds"
                type="text"
                value={formData.g2g_rounds}
                onChange={(e) => handleInputChange('g2g_rounds', e.target.value)}
                placeholder="রাউন্ড নাম্বার (কমা দিয়ে পৃথক করুন) যেমন: R1, R2, R3"
              />
              <p className="text-sm text-muted-foreground mt-1">
                যে সব G2G রাউন্ডে অংশগ্রহণ করেছেন তার তালিকা
              </p>
            </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'সংরক্ষণ করা হচ্ছে...' : 'প্রোফাইল সংরক্ষণ করুন'}
              </Button>
            </form>
          </CardContent>
        </Card>
        </TabsContent>

        {/* User Varieties Tab */}
        <TabsContent value="varieties">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>আমার জাত সমূহ</span>
              </CardTitle>
              <CardDescription>
                আপনার কাছে যে জাতগুলো আছে তা যোগ করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Variety */}
              <div className="flex space-x-2">
                <Select value={selectedVarietyId} onValueChange={setSelectedVarietyId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="জাত নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {varieties.filter(v => !userVarieties.some(uv => uv.variety_id === v.id)).map((variety) => (
                      <SelectItem key={variety.id} value={variety.id}>
                        {variety.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addUserVariety} disabled={!selectedVarietyId}>
                  <Plus className="h-4 w-4 mr-2" />
                  যোগ করুন
                </Button>
              </div>

              {/* User Varieties List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userVarieties.map((userVariety) => (
                  <div key={userVariety.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
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
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeUserVariety(userVariety.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
                <span>G2G থেকে প্রাপ্ত জাত</span>
              </CardTitle>
              <CardDescription>
                G2G গিফট হিসেবে প্রাপ্ত জাতের তালিকা
              </CardDescription>
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
  );
};

export default ProfileEdit;