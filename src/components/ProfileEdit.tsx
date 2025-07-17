import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Save, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const ProfileEdit = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    courier_address: '',
    profile_image: ''
  });
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        courier_address: profile.courier_address || '',
        profile_image: profile.profile_image || ''
      });
    }
  }, [profile]);

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
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          courier_address: formData.courier_address,
          profile_image: formData.profile_image,
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

  const profileImageUrl = formData.profile_image || 
    (formData.email ? getGravatarUrl(formData.email) : '');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
              <div className="text-center">
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
    </div>
  );
};

export default ProfileEdit;