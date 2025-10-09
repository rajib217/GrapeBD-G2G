import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, User, ArrowLeft, Search, X, Trash2 } from 'lucide-react';
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
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearingMessages, setClearingMessages] = useState(false);
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

      // Invoke edge function to send push notification
      try {
        await supabase.functions.invoke('send-message-notification', {
          body: {
            record: {
              receiver_id: selectedUser.id,
              sender_id: profile.id,
              content: newMessage.trim(),
            },
          },
        });
      } catch (notifyErr) {
        console.warn('Notification invoke failed:', notifyErr);
      }

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

  const clearMessages = async () => {
    if (!profile?.id || !selectedUser) return;

    setClearingMessages(true);
    try {
      // Delete all messages between current user and selected user
      const { error } = await supabase
        .from('messages')
        .delete()
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${profile.id})`);

      if (error) throw error;

      // Refresh messages and users list
      setMessages([]);
      await fetchUsers();
      setClearDialogOpen(false);
      
      toast({
        title: 'সফল',
        description: 'সমস্ত মেসেজ ডিলেট হয়েছে',
      });
    } catch (error) {
      console.error('Clear messages error:', error);
      toast({
        title: 'ত্রুটি',
        description: 'মেসেজ ডিলেট করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setClearingMessages(false);
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">লোড হচ্ছে...</span>
      </div>
    );
  }

  // If in direct messaging mode, show the direct message interface
  if (directMessaging && selectedUser) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center space-x-2 md:space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setDirectMessaging(false);
                  setSelectedUser(null);
                  navigate(`/user/${targetUserId}`);
                }}
                className="touch-target min-h-[44px]"
              >
                <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">ফিরে যান</span>
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.profile_image} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {selectedUser.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{selectedUser.full_name}</h2>
                <p className="text-xs text-muted-foreground">অনলাইন</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setClearDialogOpen(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 touch-target min-h-[44px]"
            >
              <Trash2 className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">ক্লিয়ার</span>
              <span className="sm:hidden">ডিলিট</span>
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="h-96 p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>কোনো মেসেজ নেই</p>
                <p className="text-xs">প্রথম মেসেজ পাঠান!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${
                      message.sender.id === profile?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl relative ${
                      message.sender.id === profile?.id 
                        ? 'bg-blue-500 text-white rounded-br-md' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender.id === profile?.id 
                          ? 'text-blue-100' 
                          : 'text-muted-foreground'
                      }`}>
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Send Message Form */}
          <div className="p-4 border-t bg-gray-50 dark:bg-gray-700">
            <div className="flex space-x-2">
              <Input
                placeholder="মেসেজ লিখুন..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 rounded-full border-0 bg-white dark:bg-gray-600"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                size="icon"
                className="rounded-full bg-blue-500 hover:bg-blue-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border mb-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-2">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">চ্যাট</h1>
              <p className="text-sm text-muted-foreground">{users.length} জন কনভার্সেশন</p>
            </div>
          </div>
          {totalUnreadCount > 0 && (
            <div className="bg-red-500 text-white rounded-full px-3 py-1 text-sm font-medium">
              {totalUnreadCount} টি নতুন
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="মেসেজ বা নাম খুঁজুন..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10 bg-gray-50 dark:bg-gray-700 border-0 rounded-full"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <ScrollArea className="h-[600px]">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                {searchQuery ? 'কোনো ফলাফল নেই' : 'কোনো কনভার্সেশন নেই'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? `"${searchQuery}" এর জন্য কোনো ইউজার পাওয়া যায়নি` : 'নতুন মেসেজ শুরু করুন'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    user.unread_count > 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => {
                    setSelectedUser(user);
                    setDialogOpen(true);
                  }}
                >
                  <div className="relative mr-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.profile_image} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {user.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {user.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {user.unread_count}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm font-medium truncate ${
                        user.unread_count > 0 ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {user.full_name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {user.role === 'admin' ? 'অ্যাডমিন' : 'মেম্বার'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      মেসেজ করতে ক্লিক করুন
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Message Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-0 bg-white dark:bg-gray-800">
          <DialogHeader className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-700">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser?.profile_image} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {selectedUser?.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-medium">{selectedUser?.full_name}</span>
                  <p className="text-xs text-muted-foreground">অনলাইন</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setClearDialogOpen(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 touch-target min-h-[44px] min-w-[44px]"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>
            
          {/* Messages Area */}
          <ScrollArea className="h-96 p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>কোনো মেসেজ নেই</p>
                <p className="text-xs">প্রথম মেসেজ পাঠান!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${
                      message.sender.id === profile?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl relative ${
                      message.sender.id === profile?.id 
                        ? 'bg-blue-500 text-white rounded-br-md' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender.id === profile?.id 
                          ? 'text-blue-100' 
                          : 'text-muted-foreground'
                      }`}>
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Send Message Form */}
          <div className="p-4 border-t bg-gray-50 dark:bg-gray-700">
            <div className="flex space-x-2">
              <Input
                placeholder="মেসেজ লিখুন..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 rounded-full border-0 bg-white dark:bg-gray-600"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                size="icon"
                className="rounded-full bg-blue-500 hover:bg-blue-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Messages Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>মেসেজ ডিলেট করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত যে {selectedUser?.full_name} এর সাথে সকল মেসেজ ডিলেট করতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearingMessages}>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearMessages}
              disabled={clearingMessages}
              className="bg-destructive hover:bg-destructive/90"
            >
              {clearingMessages ? 'ডিলেট হচ্ছে...' : 'ডিলেট করুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Messages;