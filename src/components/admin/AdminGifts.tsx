import { useState, useEffect } from 'react';
import { Search, Check, X, Eye, MessageSquare, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Gift {
  id: string;
  sender_id: string;
  receiver_id: string;
  variety_id: string;
  gift_round_id: string;
  quantity: number;
  status: 'pending' | 'approved' | 'sent' | 'received' | 'cancelled';
  admin_notes?: string;
  created_at: string;
  approved_at?: string;
  sent_at?: string;
  received_at?: string;
  // Join data
  sender_name?: string;
  receiver_name?: string;
  variety_name?: string;
  round_title?: string;
}

interface Profile {
  id: string;
  full_name: string;
  user_id: string;
}

interface Variety {
  id: string;
  name: string;
}

interface GiftRound {
  id: string;
  title: string;
  is_active: boolean;
}

interface UserStock {
  user_id: string;
  variety_id: string;
  quantity: number;
  variety: {
    name: string;
  };
}

const AdminGifts = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [giftRounds, setGiftRounds] = useState<GiftRound[]>([]);
  const [userStocks, setUserStocks] = useState<UserStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [createForm, setCreateForm] = useState({
    receiverId: '',
    senderId: '',
    varietyId: '',
    giftRoundId: '',
    quantity: 1,
    adminNotes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchGifts();
    fetchUsers();
    fetchVarieties();
    fetchGiftRounds();
  }, []);

  const fetchGifts = async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select(`
          *,
          sender:profiles!gifts_sender_id_fkey(full_name),
          receiver:profiles!gifts_receiver_id_fkey(full_name),
          variety:varieties(name),
          gift_round:gift_rounds(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const enrichedGifts = data?.map(gift => ({
        ...gift,
        sender_name: gift.sender?.full_name,
        receiver_name: gift.receiver?.full_name,
        variety_name: gift.variety?.name,
        round_title: gift.gift_round?.title
      })) || [];
      
      setGifts(enrichedGifts);
    } catch (error) {
      console.error('Error fetching gifts:', error);
      toast({
        title: "ত্রুটি",
        description: "গিফট তালিকা লোড করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, user_id')
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchVarieties = async () => {
    try {
      const { data, error } = await supabase
        .from('varieties')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVarieties(data || []);
    } catch (error) {
      console.error('Error fetching varieties:', error);
    }
  };

  const fetchGiftRounds = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_rounds')
        .select('id, title, is_active')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setGiftRounds(data || []);
    } catch (error) {
      console.error('Error fetching gift rounds:', error);
    }
  };

  const fetchUserStocks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_stocks')
        .select(`
          user_id,
          variety_id,
          quantity,
          variety:varieties(name)
        `)
        .eq('user_id', userId)
        .gt('quantity', 0);

      if (error) throw error;
      setUserStocks(data || []);
    } catch (error) {
      console.error('Error fetching user stocks:', error);
      setUserStocks([]);
    }
  };

  const handleCreateGift = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.receiverId || !createForm.senderId || !createForm.varietyId || !createForm.giftRoundId) {
      toast({
        title: "ত্রুটি",
        description: "সকল ফিল্ড পূরণ করুন",
        variant: "destructive",
      });
      return;
    }

    // Check if sender has enough stock
    const senderStock = userStocks.find(stock => 
      stock.user_id === createForm.senderId && stock.variety_id === createForm.varietyId
    );

    if (!senderStock || senderStock.quantity < createForm.quantity) {
      toast({
        title: "ত্রুটি",
        description: "প্রেরকের কাছে পর্যাপ্ত স্টক নেই",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('gifts')
        .insert({
          sender_id: createForm.senderId,
          receiver_id: createForm.receiverId,
          variety_id: createForm.varietyId,
          gift_round_id: createForm.giftRoundId,
          quantity: createForm.quantity,
          admin_notes: createForm.adminNotes || null,
          status: 'approved'
        });

      if (error) throw error;
      
      toast({
        title: "সফল",
        description: "গিফট তৈরি করা হয়েছে",
      });
      
      setIsCreateOpen(false);
      setCreateForm({
        receiverId: '',
        senderId: '',
        varietyId: '',
        giftRoundId: '',
        quantity: 1,
        adminNotes: ''
      });
      fetchGifts();
    } catch (error) {
      console.error('Error creating gift:', error);
      toast({
        title: "ত্রুটি",
        description: "গিফট তৈরি করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (giftId: string, newStatus: string, notes?: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (notes) {
        updateData.admin_notes = notes;
      }
      
      if (newStatus === 'approved') {
        updateData.approved_at = new Date().toISOString();
      } else if (newStatus === 'sent') {
        updateData.sent_at = new Date().toISOString();
      } else if (newStatus === 'received') {
        updateData.received_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('gifts')
        .update(updateData)
        .eq('id', giftId);

      if (error) throw error;
      
      toast({
        title: "সফল",
        description: `গিফট স্ট্যাটাস ${getStatusLabel(newStatus)} এ পরিবর্তন করা হয়েছে`,
      });
      
      fetchGifts();
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Error updating gift status:', error);
      toast({
        title: "ত্রুটি",
        description: "গিফট স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'পেন্ডিং',
      approved: 'অনুমোদিত',
      sent: 'পাঠানো',
      received: 'প্রাপ্ত',
      cancelled: 'বাতিল'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants = {
      pending: 'outline',
      approved: 'default',
      sent: 'secondary',
      received: 'default',
      cancelled: 'destructive'
    };
    return variants[status as keyof typeof variants] || 'outline';
  };

  const openGiftDetail = (gift: Gift) => {
    setSelectedGift(gift);
    setAdminNotes(gift.admin_notes || '');
    setIsDetailOpen(true);
  };

  const filteredGifts = gifts.filter(gift => {
    const matchesSearch = 
      gift.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gift.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gift.variety_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gift.round_title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || gift.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSenderChange = (senderId: string) => {
    setCreateForm({ ...createForm, senderId, varietyId: '' });
    if (senderId) {
      fetchUserStocks(senderId);
    } else {
      setUserStocks([]);
    }
  };

  const getAvailableQuantity = (varietyId: string) => {
    const stock = userStocks.find(s => s.variety_id === varietyId);
    return stock?.quantity || 0;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">গিফট ম্যানেজমেন্ট</h2>
          <p className="text-muted-foreground">গিফট অনুমোদন এবং ট্র্যাকিং</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          নতুন গিফট তৈরি
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="প্রেরক, প্রাপক, জাত বা রাউন্ড দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="স্ট্যাটাস ফিল্টার" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
            <SelectItem value="pending">পেন্ডিং</SelectItem>
            <SelectItem value="approved">অনুমোদিত</SelectItem>
            <SelectItem value="sent">পাঠানো</SelectItem>
            <SelectItem value="received">প্রাপ্ত</SelectItem>
            <SelectItem value="cancelled">বাতিল</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gifts List */}
      <div className="space-y-4">
        {filteredGifts.map((gift) => (
          <Card key={gift.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {gift.sender_name} → {gift.receiver_name}
                  </CardTitle>
                  <CardDescription>
                    {gift.variety_name} - {gift.quantity}টি চারা | {gift.round_title}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusVariant(gift.status) as any}>
                    {getStatusLabel(gift.status)}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openGiftDetail(gift)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>তৈরি: {new Date(gift.created_at).toLocaleDateString('bn-BD')}</span>
                {gift.admin_notes && (
                  <div className="flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    অ্যাডমিন নোট আছে
                  </div>
                )}
              </div>
              
              {gift.status === 'pending' && (
                <div className="flex space-x-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(gift.id, 'approved')}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    অনুমোদন
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleStatusUpdate(gift.id, 'cancelled')}
                  >
                    <X className="h-3 w-3 mr-1" />
                    বাতিল
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGifts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">কোনো গিফট পাওয়া যায়নি</p>
        </div>
      )}

      {/* Create Gift Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>নতুন গিফট তৈরি করুন</DialogTitle>
            <DialogDescription>
              একজন ইউজারকে অন্য ইউজারের কাছে গিফট পাঠানোর জন্য নির্দেশ দিন
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateGift} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receiver">গিফট প্রাপক</Label>
                <Select value={createForm.receiverId} onValueChange={(value) => setCreateForm({ ...createForm, receiverId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="প্রাপক নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sender">গিফট প্রেরক</Label>
                <Select value={createForm.senderId} onValueChange={handleSenderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="প্রেরক নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="variety">জাত</Label>
                <Select 
                  value={createForm.varietyId} 
                  onValueChange={(value) => setCreateForm({ ...createForm, varietyId: value })}
                  disabled={!createForm.senderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="জাত নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {userStocks.map((stock) => (
                      <SelectItem key={stock.variety_id} value={stock.variety_id}>
                        {stock.variety.name} (স্টক: {stock.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">পরিমাণ</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={getAvailableQuantity(createForm.varietyId)}
                  value={createForm.quantity}
                  onChange={(e) => setCreateForm({ ...createForm, quantity: parseInt(e.target.value) || 1 })}
                  disabled={!createForm.varietyId}
                />
                {createForm.varietyId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    সর্বোচ্চ: {getAvailableQuantity(createForm.varietyId)}টি
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="giftRound">গিফট রাউন্ড</Label>
              <Select value={createForm.giftRoundId} onValueChange={(value) => setCreateForm({ ...createForm, giftRoundId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="গিফট রাউন্ড নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {giftRounds.map((round) => (
                    <SelectItem key={round.id} value={round.id}>
                      {round.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="adminNotes">অ্যাডমিন নোট (ঐচ্ছিক)</Label>
              <Textarea
                id="adminNotes"
                value={createForm.adminNotes}
                onChange={(e) => setCreateForm({ ...createForm, adminNotes: e.target.value })}
                placeholder="অতিরিক্ত নোট লিখুন..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                বাতিল
              </Button>
              <Button type="submit">
                <Send className="h-4 w-4 mr-2" />
                গিফট তৈরি করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gift Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>গিফট বিস্তারিত</DialogTitle>
            <DialogDescription>
              গিফটের সম্পূর্ণ তথ্য এবং ব্যবস্থাপনা
            </DialogDescription>
          </DialogHeader>
          
          {selectedGift && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>প্রেরক</Label>
                  <p className="font-medium">{selectedGift.sender_name}</p>
                </div>
                <div>
                  <Label>প্রাপক</Label>
                  <p className="font-medium">{selectedGift.receiver_name}</p>
                </div>
                <div>
                  <Label>জাত</Label>
                  <p className="font-medium">{selectedGift.variety_name}</p>
                </div>
                <div>
                  <Label>পরিমাণ</Label>
                  <p className="font-medium">{selectedGift.quantity}টি চারা</p>
                </div>
                <div>
                  <Label>রাউন্ড</Label>
                  <p className="font-medium">{selectedGift.round_title}</p>
                </div>
                <div>
                  <Label>বর্তমান স্ট্যাটাস</Label>
                  <Badge variant={getStatusVariant(selectedGift.status) as any}>
                    {getStatusLabel(selectedGift.status)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>তারিখের তথ্য</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>তৈরি: {new Date(selectedGift.created_at).toLocaleString('bn-BD')}</p>
                  {selectedGift.approved_at && (
                    <p>অনুমোদিত: {new Date(selectedGift.approved_at).toLocaleString('bn-BD')}</p>
                  )}
                  {selectedGift.sent_at && (
                    <p>পাঠানো: {new Date(selectedGift.sent_at).toLocaleString('bn-BD')}</p>
                  )}
                  {selectedGift.received_at && (
                    <p>প্রাপ্ত: {new Date(selectedGift.received_at).toLocaleString('bn-BD')}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="admin_notes">অ্যাডমিন নোট</Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="অ্যাডমিন নোট লিখুন..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>স্ট্যাটাস পরিবর্তন</Label>
                <div className="flex space-x-2 mt-2">
                  {selectedGift.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(selectedGift.id, 'approved', adminNotes)}
                      >
                        অনুমোদন করুন
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStatusUpdate(selectedGift.id, 'cancelled', adminNotes)}
                      >
                        বাতিল করুন
                      </Button>
                    </>
                  )}
                  {selectedGift.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(selectedGift.id, 'sent', adminNotes)}
                    >
                      পাঠানো হিসেবে চিহ্নিত করুন
                    </Button>
                  )}
                  {selectedGift.status === 'sent' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(selectedGift.id, 'received', adminNotes)}
                    >
                      প্রাপ্ত হিসেবে চিহ্নিত করুন
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{gifts.length}</div>
            <p className="text-sm text-muted-foreground">মোট গিফট</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{gifts.filter(g => g.status === 'pending').length}</div>
            <p className="text-sm text-muted-foreground">পেন্ডিং</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{gifts.filter(g => g.status === 'approved').length}</div>
            <p className="text-sm text-muted-foreground">অনুমোদিত</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{gifts.filter(g => g.status === 'sent').length}</div>
            <p className="text-sm text-muted-foreground">পাঠানো</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{gifts.filter(g => g.status === 'received').length}</div>
            <p className="text-sm text-muted-foreground">প্রাপ্ত</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminGifts;
