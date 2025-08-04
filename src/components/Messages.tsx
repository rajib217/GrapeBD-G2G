
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Send, Circle, User, ArrowLeft, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  full_name: string;
  email?: string;
  role: 'admin' | 'member';
  status: 'active' | 'suspended' | 'pending';
  profile_image?: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender: Profile;
  receiver: Profile;
}

interface UserWithUnreadCount extends Profile {
  unread_count: number;
}

const Messages = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUserId = searchParams.get('userId');
  
  const [users, setUsers] = useState<UserWithUnreadCount[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithUnreadCount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [directMessaging, setDirectMessaging] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchUsers = async () => {
    if (!profile?.id) return;

    try {
      // Get users who have exchanged messages with current user
      const { data: messageUsers, error: messageError } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

      if (messageError) throw messageError;

      // Get unique user IDs who have exchanged messages
      const uniqueUserIds = [...new Set(
        messageUsers?.flatMap(msg => [msg.sender_id, msg.receiver_id])
          .filter(id => id !== profile.id)
      )];

      if (uniqueUserIds.length === 0) {
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }

      // Get user details for these IDs
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active')
        .in('id', uniqueUserIds);

      if (usersError) throw usersError;

      // Get unread message counts for each user
      const usersWithUnreadCount: UserWithUnreadCount[] = [];
      
      for (const user of usersData || []) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', user.id)
          .eq('receiver_id', profile.id)
          .eq('is_read', false);

        usersWithUnreadCount.push({
          ...user,
          unread_count: count || 0
        });
      }

      setUsers(usersWithUnreadCount);
      setFilteredUsers(usersWithUnreadCount);
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'ইউজার লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          is_read,
          sender_id,
          receiver_id,
          sender:profiles!messages_sender_id_fkey(id, full_name, email, role, status, profile_image),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, email, role, status, profile_image)
        `)
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${profile.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages from selected user as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', userId)
        .eq('receiver_id', profile.id)
        .eq('is_read', false);

      // Refresh users list to update unread counts
      fetchUsers();
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'মেসেজ লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!profile?.id || !selectedUser || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: profile.id,
          receiver_id: selectedUser.id,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      await fetchMessages(selectedUser.id);
      
      toast({
        title: 'সফল',
        description: 'মেসেজ পাঠানো হয়েছে',
      });
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'মেসেজ পাঠাতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.full_name.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredUsers(users);
  };

  const totalUnreadCount = users.reduce((sum, user) => sum + user.unread_count, 0);

  // Update filtered users when users change
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [users, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser]);

  // Handle direct messaging via URL parameter
  useEffect(() => {
    if (targetUserId && users.length > 0) {
      const targetUser = users.find(user => user.id === targetUserId);
      if (targetUser) {
        setSelectedUser(targetUser);
        setDirectMessaging(true);
      }
    }
  }, [targetUserId, users]);

  if (loading) {
    return <div className="text-center py-8">লোড হচ্ছে...</div>;
  }

  // If in direct messaging mode, show the direct message interface
  if (directMessaging && selectedUser) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setDirectMessaging(false);
              setSelectedUser(null);
              navigate(`/user/${targetUserId}`);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ফিরে যান
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={selectedUser.profile_image} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold">{selectedUser.full_name} এর সাথে মেসেজ</h2>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Messages Area */}
              <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    কোনো মেসেজ নেই
                  </div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${
                        message.sender.id === profile?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender.id === profile?.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender.id === profile?.id 
                            ? 'text-blue-100' 
                            : 'text-gray-500'
                        }`}>
                          {formatDate(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Send Message Form */}
              <div className="space-y-3">
                <Textarea
                  placeholder="আপনার মেসেজ লিখুন..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingMessage ? 'পাঠানো হচ্ছে...' : 'মেসেজ পাঠান'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">মেসেজ</h2>
        <Badge variant="secondary">{users.length} জন ইউজার</Badge>
        {totalUnreadCount > 0 && (
          <Badge variant="destructive">{totalUnreadCount} টি নতুন</Badge>
        )}
      </div>

      {/* Search Box */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="ইউজার খুঁজুন (নাম বা ইমেইল)..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            "{searchQuery}" এর জন্য {filteredUsers.length} টি ফলাফল পাওয়া গেছে
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card 
            key={user.id}
            className={`hover:shadow-md transition-shadow cursor-pointer ${
              user.unread_count > 0 ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profile_image} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm">{user.full_name}</CardTitle>
                    <div className="flex items-center space-x-1 mt-1">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {user.role === 'admin' ? 'অ্যাডমিন' : 'মেম্বার'}
                      </Badge>
                      {user.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {user.unread_count} নতুন
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {user.unread_count > 0 && (
                  <Circle className="h-3 w-3 text-blue-500 fill-current" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Dialog open={dialogOpen && selectedUser?.id === user.id} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSelectedUser(user);
                      setDialogOpen(true);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    মেসেজ করুন
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profile_image} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.full_name} এর সাথে মেসেজ</span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Messages Area */}
                    <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          কোনো মেসেজ নেই
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div 
                            key={message.id}
                            className={`flex ${
                              message.sender.id === profile?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender.id === profile?.id 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-800'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.sender.id === profile?.id 
                                  ? 'text-blue-100' 
                                  : 'text-gray-500'
                              }`}>
                                {formatDate(message.created_at)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Send Message Form */}
                    <div className="space-y-3">
                      <Textarea
                        placeholder="আপনার মেসেজ লিখুন..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {sendingMessage ? 'পাঠানো হচ্ছে...' : 'মেসেজ পাঠান'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && searchQuery && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">কোনো ইউজার পাওয়া যায়নি</h3>
            <p className="text-gray-500">"{searchQuery}" এর জন্য কোনো ইউজার খুঁজে পাওয়া যায়নি</p>
            <Button variant="outline" className="mt-4" onClick={clearSearch}>
              সব ইউজার দেখান
            </Button>
          </CardContent>
        </Card>
      )}

      {users.length === 0 && !searchQuery && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">কোনো ইউজার নেই</h3>
            <p className="text-gray-500">এখনো কোনো অন্য ইউজার সক্রিয় নেই</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Messages;
