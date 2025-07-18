
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Phone, Mail, MapPin, Calendar, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  courier_address?: string;
  profile_image?: string;
  role: 'admin' | 'member';
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
}

const AllMembers = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "ত্রুটি",
        description: "মেম্বার তালিকা লোড করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (member: Profile) => {
    setSelectedMember(member);
    setIsDialogOpen(true);
  };

  const filteredMembers = members.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone?.includes(searchTerm)
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">সকল মেম্বার</h2>
          <p className="text-muted-foreground">সিস্টেমের সব সদস্যদের তালিকা এবং প্রোফাইল দেখুন</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="নাম, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={member.profile_image} alt={member.full_name} />
                  <AvatarFallback>
                    {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{member.full_name}</CardTitle>
                  <CardDescription>
                    {new Date(member.created_at).toLocaleDateString('bn-BD')}
                  </CardDescription>
                </div>
              </div>
              <div className="flex space-x-2">
                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                  {member.role === 'admin' ? 'অ্যাডমিন' : 'মেম্বার'}
                </Badge>
                <Badge variant="default">সক্রিয়</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {member.email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    {member.phone}
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/profile/${member.id}`)}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                প্রোফাইল দেখুন
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">কোনো মেম্বার পাওয়া যায়নি</p>
        </div>
      )}

      {/* Profile Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>মেম্বার প্রোফাইল</DialogTitle>
            <DialogDescription>
              {selectedMember?.full_name} এর বিস্তারিত তথ্য
            </DialogDescription>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMember.profile_image} alt={selectedMember.full_name} />
                  <AvatarFallback>
                    {selectedMember.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedMember.full_name}</h3>
                  <Badge variant={selectedMember.role === 'admin' ? 'default' : 'secondary'}>
                    {selectedMember.role === 'admin' ? 'অ্যাডমিন' : 'মেম্বার'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {selectedMember.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedMember.email}</span>
                  </div>
                )}
                
                {selectedMember.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedMember.phone}</span>
                  </div>
                )}
                
                {selectedMember.courier_address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedMember.courier_address}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    যোগদান: {new Date(selectedMember.created_at).toLocaleDateString('bn-BD')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-sm text-muted-foreground">মোট সদস্য</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{members.filter(m => m.role === 'admin').length}</div>
            <p className="text-sm text-muted-foreground">অ্যাডমিন</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{members.filter(m => m.role === 'member').length}</div>
            <p className="text-sm text-muted-foreground">সাধারণ সদস্য</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AllMembers;
