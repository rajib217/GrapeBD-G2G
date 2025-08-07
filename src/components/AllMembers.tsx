
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Phone, Mail, MapPin, Calendar, Eye, MessageSquare, PhoneCall } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MessageModal from './MessageModal';

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
  unread_messages_count?: number;
  own_varieties?: string[];
  gift_varieties?: string[];
}

// Rainbow border animation for admin avatars
const rainbowKeyframes = `
@keyframes rainbow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;

const style = document.createElement('style');
style.textContent = rainbowKeyframes;
document.head.appendChild(style);

const AllMembers = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedMessageRecipient, setSelectedMessageRecipient] = useState<Profile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Get additional data for each user
      const membersWithDetails = await Promise.all(
        (profilesData || []).map(async (profile) => {
          // 1. Unread message count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', profile.id)
            .eq('is_read', false);

          // 2. Own varieties
          const { data: ownVarietiesData } = await supabase
            .from('user_varieties')
            .select('varieties(name)')
            .eq('user_id', profile.id);

          // 3. Gifted varieties
          const { data: giftVarietiesData } = await supabase
            .rpc('get_user_received_gift_varieties', { profile_id: profile.id });

          return {
            ...profile,
            unread_messages_count: count || 0,
            own_varieties: ownVarietiesData?.map((v: any) => v.varieties.name) || [],
            gift_varieties: giftVarietiesData?.map((v: any) => v.variety_name) || [],
          };
        })
      );

      setMembers(membersWithDetails);
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

  const handleOpenMessageModal = (member: Profile) => {
    setSelectedMessageRecipient(member);
    setMessageModalOpen(true);
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
      <style>
        {`
          .rainbow-border {
            background: linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
            background-size: 200% 200%;
            animation: rainbow 5s ease infinite;
          }
        `}
      </style>
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

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMembers.map((member) => (
          <div 
            key={member.id} 
            className="bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors border relative"
            onClick={() => navigate(`/user/${member.id}`)}
          >
            <div className="flex items-start space-x-3">
              <div className="relative">
                <div className={`${member.role === 'admin' ? 'rainbow-border rounded-full p-0.5' : ''}`}>
                  <Avatar className={`h-14 w-14 cursor-pointer ${member.role === 'admin' ? 'border-2 border-white' : 'border-2 border-gray-200'}`}>
                    <AvatarImage src={member.profile_image} alt={member.full_name} />
                    <AvatarFallback className={`${member.role === 'admin' ? 'bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400' : 'bg-gradient-to-br from-blue-100 to-blue-200'} text-lg ${member.role === 'admin' ? 'text-white' : 'text-blue-600'}`}>
                      {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {member.role === 'admin' && (
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center bg-gradient-to-r from-yellow-400 to-orange-500 border-2 border-white">
                      ⭐
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 hover:underline cursor-pointer truncate">
                      {member.full_name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-0.5">
                      <span>যোগদান: {new Date(member.created_at).toLocaleDateString('bn-BD')}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                     
                     {member.gift_varieties && member.gift_varieties.length > 0 && (
                       <Badge variant="default" className="bg-green-500 text-white"> G2G গিফট: {member.gift_varieties.join(', ')}</Badge>
                     )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-9 w-9 p-0 relative ${member.unread_messages_count > 0 ? 'text-blue-600' : 'text-gray-500'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenMessageModal(member);
                      }}
                    >
                      <MessageSquare className="h-5 w-5" />
                      {member.unread_messages_count > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {member.unread_messages_count}
                        </span>
                      )}
                    </Button>
                    {member.phone && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-9 w-9 p-0 text-green-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:${member.phone}`;
                        }}
                      >
                        <PhoneCall className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
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

      {/* Message Modal */}
      {selectedMessageRecipient && (
        <MessageModal
          isOpen={messageModalOpen}
          onClose={() => {
            setMessageModalOpen(false);
            setSelectedMessageRecipient(null);
          }}
          recipient={selectedMessageRecipient}
        />
      )}

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
