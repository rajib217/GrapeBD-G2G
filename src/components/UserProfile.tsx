import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  courier_address: string | null;
  profile_image: string | null;
  status: string;
  role: string;
  created_at: string;
}

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline" 
            size="sm"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ফিরে যান
          </Button>
        </div>

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
          </CardHeader>
          
          <CardContent className="space-y-4">
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
            
            <div className="text-sm text-gray-500 mt-4">
              যোগদানের তারিখ: {new Date(profile.created_at).toLocaleDateString('bn-BD', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;