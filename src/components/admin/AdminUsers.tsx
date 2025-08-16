import { useState, useEffect } from 'react';
import { Search, Edit, Shield, ShieldOff, User, Mail, Phone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  status_icon?: string;
  created_at: string;
  updated_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    role: 'member' as 'admin' | 'member',
    status: 'active' as 'active' | 'suspended' | 'pending'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "ত্রুটি",
        description: "ইউজার তালিকা লোড করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: Profile) => {
    setEditingUser(user);
    setFormData({
      role: user.role,
      status: user.status
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', editingUser.id);

      if (error) throw error;
      
      toast({
        title: "সফল",
        description: "ইউজার তথ্য আপডেট করা হয়েছে",
      });

      setIsDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "ত্রুটি",
        description: "ইউজার তথ্য আপডেট করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (user: Profile) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
        title: "সফল",
        description: `ইউজার ${newStatus === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`,
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: "ত্রুটি",
        description: "ইউজার স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    
    setIsDeleting(true);
    try {
      // Check if trying to delete an admin
      if (deletingUser.role === 'admin') {
        throw new Error('Cannot delete admin users');
      }

      // First check the current user's session
      console.log('Starting delete process for user:', deletingUser);

      const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getUser();
      console.log('Current user session:', currentUser, 'Session error:', sessionError);
      
      if (sessionError || !currentUser) {
        console.error('Session error:', sessionError);
        throw new Error('session_expired');
      }

      // Check if the current user has admin role
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', currentUser.id)
        .single();

      console.log('Admin check:', adminCheck, 'Admin check error:', adminCheckError);

      if (adminCheckError || adminCheck?.role !== 'admin') {
        throw new Error('Only admins can delete users');
      }

      // Then try to delete the user
      console.log('Attempting to delete user with target_user_id:', deletingUser.user_id);
      
      try {
        if (!deletingUser?.id || !deletingUser?.user_id) {
          console.error('Missing user information:', deletingUser);
          throw new Error('invalid_user_data');
        }

        console.log('Deleting user with profile ID:', deletingUser.id);
        console.log('Deleting user with auth ID:', deletingUser.user_id);

        // Manual deletion in correct order
        console.log('Starting manual deletion in order...');
        
        // 1. Delete user notices and reads
        console.log('Deleting user notice reads...');
        const { error: noticeReadsError } = await supabase
          .from('user_notice_reads')
          .delete()
          .eq('user_id', deletingUser.id);
        if (noticeReadsError) throw noticeReadsError;

        // 2. Delete messages
        console.log('Deleting messages...');
        const { error: messagesError } = await supabase
          .from('messages')
          .delete()
          .or(`sender_id.eq.${deletingUser.id},receiver_id.eq.${deletingUser.id}`);
        if (messagesError) throw messagesError;

        // 3. Delete reactions
        console.log('Deleting reactions...');
        const { error: reactionsError } = await supabase
          .from('reactions')
          .delete()
          .eq('user_id', deletingUser.id);
        if (reactionsError) throw reactionsError;

        // 4. Delete comments
        console.log('Deleting comments...');
        const { error: commentsError } = await supabase
          .from('comments')
          .delete()
          .eq('user_id', deletingUser.id);
        if (commentsError) throw commentsError;

        // 5. Delete posts
        console.log('Deleting posts...');
        const { error: postsError } = await supabase
          .from('posts')
          .delete()
          .eq('user_id', deletingUser.id);
        if (postsError) throw postsError;

        // 6. Delete gifts - both sent and received
        console.log('Deleting gifts...');
        const { error: giftsError } = await supabase
          .from('gifts')
          .delete()
          .or(`sender_id.eq.${deletingUser.id},receiver_id.eq.${deletingUser.id}`);
        if (giftsError) throw giftsError;

        // 7. Delete stocks
        console.log('Deleting user stocks...');
        const { error: stocksError } = await supabase
          .from('user_stocks')
          .delete()
          .eq('user_id', deletingUser.id);
        if (stocksError) throw stocksError;

        // 8. Delete varieties
        console.log('Deleting user varieties...');
        const { error: varietiesError } = await supabase
          .from('user_varieties')
          .delete()
          .eq('user_id', deletingUser.id);
        if (varietiesError) throw varietiesError;

        // 9. Delete notices
        console.log('Deleting notices...');
        const { error: noticesError } = await supabase
          .from('notices')
          .delete()
          .eq('user_id', deletingUser.id);
        if (noticesError) throw noticesError;

        // 10. Finally delete profile
        console.log('Deleting profile...');
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', deletingUser.id);
        if (profileError) throw profileError;

        console.log('All data deleted successfully!');

        console.log('User deleted successfully');
      } catch (deleteError: any) {
        console.error('Delete error details:', {
          error: deleteError,
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint
        });
        throw deleteError;
      }

      if (deleteError) {
        console.error('Delete error details:', {
          code: deleteError.code,
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint
        });
        throw deleteError;
      }

      toast({
        title: "সফল",
        description: "ইউজার এবং সংশ্লিষ্ট সকল তথ্য মুছে ফেলা হয়েছে",
      });
      
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Delete process failed:', {
        error: error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        user: deletingUser
      });
      
      let errorMessage = "ইউজার মুছে ফেলতে সমস্যা হয়েছে";
      
      if (error.message === 'session_expired') {
        errorMessage = "সেশন মেয়াদ শেষ হয়েছে। আবার লগইন করুন";
      } else if (error.message === 'invalid_user_data') {
        errorMessage = "ইউজারের তথ্য সঠিক নয়";
      } else if (error.message?.includes('Cannot delete admin users')) {
        errorMessage = "অ্যাডমিন ইউজার মুছে ফেলা যাবে না";
      } else if (error.message?.includes('Only admins can delete users')) {
        errorMessage = "শুধুমাত্র অ্যাডমিনরা ইউজার মুছতে পারবেন";
      } else if (error.code === 'PGRST116' || error.message?.includes('permission denied')) {
        errorMessage = "অনুমতি নেই। অ্যাডমিন রোল চেক করুন";
      } else if (error.code === '23503') {
        if (error.message?.includes('gifts_receiver_id_fkey')) {
          errorMessage = "ইউজারের গিফট হিস্টরি আছে। মুছে ফেলা সম্ভব নয়।";
        } else if (error.message?.includes('posts_user_id_fkey')) {
          errorMessage = "ইউজারের পোস্ট আছে। আগে সেগুলো মুছুন।";
        } else if (error.message?.includes('comments_user_id_fkey')) {
          errorMessage = "ইউজারের কমেন্ট আছে। আগে সেগুলো মুছুন।";
        } else {
          errorMessage = "ইউজারের কিছু ডাটা আছে যা মুছে ফেলা যায়নি।";
        }
      } else if (error.message?.includes('User not found')) {
        errorMessage = "ইউজার পাওয়া যায়নি";
      } else if (error.message?.includes('auth.')) {
        errorMessage = "অথেনটিকেশন সমস্যা, দয়া করে আবার চেষ্টা করুন";
      }
      
      console.log('Showing error message to user:', errorMessage);

      toast({
        title: "ত্রুটি",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">ইউজার ম্যানেজমেন্ট</h2>
          <p className="text-muted-foreground">সিস্টেমের সব ইউজারের তালিকা এবং ব্যবস্থাপনা</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="নাম, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="ভূমিকা ফিল্টার" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব ভূমিকা</SelectItem>
            <SelectItem value="admin">অ্যাডমিন</SelectItem>
            <SelectItem value="member">মেম্বার</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="স্ট্যাটাস ফিল্টার" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
            <SelectItem value="active">সক্রিয়</SelectItem>
            <SelectItem value="suspended">নিষ্ক্রিয়</SelectItem>
            <SelectItem value="pending">পেন্ডিং</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className={user.status === 'suspended' ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user.profile_image} alt={user.full_name} />
                  <AvatarFallback>
                    {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{user.full_name}</CardTitle>
                  <CardDescription>
                    {new Date(user.created_at).toLocaleDateString('bn-BD')}
                  </CardDescription>
                </div>
              </div>
              <div className="flex space-x-2">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? 'অ্যাডমিন' : 'মেম্বার'}
                </Badge>
                <Badge variant={
                  user.status === 'active' ? 'default' : 
                  user.status === 'suspended' ? 'destructive' : 'secondary'
                }>
                  {user.status === 'active' ? 'সক্রিয়' : 
                   user.status === 'suspended' ? 'নিষ্ক্রিয়' : 'পেন্ডিং'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {user.email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    {user.email}
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    {user.phone}
                  </div>
                )}
                {user.courier_address && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="h-4 w-4 mr-2" />
                    {user.courier_address}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Dialog open={isDialogOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                  if (!open) {
                    setIsDialogOpen(false);
                    setEditingUser(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>ইউজার সম্পাদনা</DialogTitle>
                      <DialogDescription>
                        {user.full_name} এর তথ্য সম্পাদনা করুন
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="role">ভূমিকা</Label>
                        <Select value={formData.role} onValueChange={(value: 'admin' | 'member') => setFormData({ ...formData, role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">মেম্বার</SelectItem>
                            <SelectItem value="admin">অ্যাডমিন</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">স্ট্যাটাস</Label>
                        <Select value={formData.status} onValueChange={(value: 'active' | 'suspended' | 'pending') => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">সক্রিয়</SelectItem>
                            <SelectItem value="suspended">নিষ্ক্রিয়</SelectItem>
                            <SelectItem value="pending">পেন্ডিং</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button type="submit">আপডেট করুন</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleUserStatus(user)}
                >
                  {user.status === 'active' ? <ShieldOff className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                </Button>

                <Dialog open={isDeleteDialogOpen && deletingUser?.id === user.id} onOpenChange={(open) => {
                  if (!open) {
                    setIsDeleteDialogOpen(false);
                    setDeletingUser(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (user.role === 'admin') {
                          toast({
                            title: "ত্রুটি",
                            description: "অ্যাডমিন ইউজার মুছে ফেলা যাবে না",
                            variant: "destructive",
                          });
                          return;
                        }
                        setDeletingUser(user);
                        setIsDeleteDialogOpen(true);
                      }}
                      disabled={user.role === 'admin' || isDeleting}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>ইউজার মুছে ফেলুন</DialogTitle>
                      <DialogDescription>
                        আপনি কি নিশ্চিত যে <span className="font-semibold">{user.full_name}</span> কে মুছে ফেলতে চান?
                        <br />
                        <br />
                        এই কাজটি অপরিবর্তনীয়। ইউজারের সব ডাটা স্থায়ীভাবে মুছে যাবে:
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                          <li>ব্যক্তিগত তথ্য</li>
                          <li>পোস্ট এবং কমেন্ট</li>
                          <li>রিয়্যাকশন</li>
                          <li>মেসেজ</li>
                          <li>গিফট হিস্টরি</li>
                          <li>স্টক এবং ভ্যারাইটি তথ্য</li>
                          <li>নোটিশ এবং নোটিফিকেশন</li>
                        </ul>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDeleteDialogOpen(false);
                          setDeletingUser(null);
                        }}
                        disabled={isDeleting}
                      >
                        বাতিল করুন
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteConfirm}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>মুছে ফেলা হচ্ছে...</>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            মুছে ফেলুন
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">কোনো ইউজার পাওয়া যায়নি</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-sm text-muted-foreground">মোট ইউজার</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div>
            <p className="text-sm text-muted-foreground">অ্যাডমিন</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</div>
            <p className="text-sm text-muted-foreground">সক্রিয় ইউজার</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.filter(u => u.status === 'suspended').length}</div>
            <p className="text-sm text-muted-foreground">নিষ্ক্রিয় ইউজার</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;