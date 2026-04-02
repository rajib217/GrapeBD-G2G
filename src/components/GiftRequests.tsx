import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HandHeart, Plus, Check, X, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GiftRequest {
  id: string;
  requester_id: string;
  variety_id: string | null;
  variety_name: string | null;
  quantity: number;
  note: string | null;
  status: string;
  fulfilled_by: string | null;
  created_at: string;
  requester?: { full_name: string; profile_image: string | null };
  variety?: { name: string } | null;
  fulfiller?: { full_name: string } | null;
}

interface Variety {
  id: string;
  name: string;
}

const GiftRequests = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<GiftRequest[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    variety_id: '',
    custom_name: '',
    quantity: 1,
    note: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqRes, varRes] = await Promise.all([
        supabase.from('gift_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('varieties').select('id, name').eq('is_active', true).order('name'),
      ]);

      const reqs = reqRes.data || [];
      const profileIds = [...new Set([...reqs.map(r => r.requester_id), ...reqs.filter(r => r.fulfilled_by).map(r => r.fulfilled_by!)])];
      
      let profileMap = new Map();
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, profile_image').in('id', profileIds);
        profileMap = new Map((profiles || []).map(p => [p.id, p]));
      }

      const varMap = new Map((varRes.data || []).map(v => [v.id, v]));

      const enriched = reqs.map(r => ({
        ...r,
        requester: profileMap.get(r.requester_id),
        variety: r.variety_id ? varMap.get(r.variety_id) : null,
        fulfiller: r.fulfilled_by ? profileMap.get(r.fulfilled_by) : null,
      }));

      setRequests(enriched);
      setVarieties(varRes.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    const varietyName = formData.variety_id 
      ? varieties.find(v => v.id === formData.variety_id)?.name 
      : formData.custom_name;

    if (!varietyName) {
      toast.error('জাত নির্বাচন করুন বা নাম লিখুন');
      return;
    }

    const { error } = await supabase.from('gift_requests').insert({
      requester_id: profile.id,
      variety_id: formData.variety_id || null,
      variety_name: varietyName,
      quantity: formData.quantity,
      note: formData.note || null,
    });

    if (error) {
      toast.error('রিকোয়েস্ট তৈরি করা যায়নি');
      return;
    }

    toast.success('রিকোয়েস্ট তৈরি হয়েছে!');
    setDialogOpen(false);
    setFormData({ variety_id: '', custom_name: '', quantity: 1, note: '' });
    fetchData();
  };

  const handleFulfill = async (requestId: string) => {
    if (!profile?.id) return;
    const { error } = await supabase.from('gift_requests')
      .update({ status: 'fulfilled', fulfilled_by: profile.id, updated_at: new Date().toISOString() })
      .eq('id', requestId);
    
    if (error) { toast.error('আপডেট করা যায়নি'); return; }
    toast.success('ধন্যবাদ! রিকোয়েস্ট পূরণ হয়েছে 🎉');
    fetchData();
  };

  const handleClose = async (requestId: string) => {
    const { error } = await supabase.from('gift_requests')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) { toast.error('বন্ধ করা যায়নি'); return; }
    toast.success('রিকোয়েস্ট বন্ধ হয়েছে');
    fetchData();
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('রিকোয়েস্ট ডিলিট করবেন?')) return;
    const { error } = await supabase.from('gift_requests').delete().eq('id', requestId);
    if (error) { toast.error('ডিলিট করা যায়নি'); return; }
    toast.success('ডিলিট হয়েছে');
    fetchData();
  };

  const filteredRequests = requests.filter(r => {
    const name = r.variety?.name || r.variety_name || '';
    const requester = r.requester?.full_name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           requester.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <HandHeart className="w-6 h-6 text-primary" />
          চারা রিকোয়েস্ট
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" /> রিকোয়েস্ট
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>নতুন চারা রিকোয়েস্ট</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">জাত নির্বাচন করুন</label>
                <Select value={formData.variety_id} onValueChange={v => setFormData(f => ({ ...f, variety_id: v, custom_name: '' }))}>
                  <SelectTrigger><SelectValue placeholder="জাত বেছে নিন" /></SelectTrigger>
                  <SelectContent>
                    {varieties.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!formData.variety_id && (
                <div>
                  <label className="text-sm font-medium text-foreground">অথবা জাতের নাম লিখুন</label>
                  <Input 
                    value={formData.custom_name} 
                    onChange={e => setFormData(f => ({ ...f, custom_name: e.target.value }))}
                    placeholder="জাতের নাম"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-foreground">পরিমাণ</label>
                <Input 
                  type="number" min={1}
                  value={formData.quantity} 
                  onChange={e => setFormData(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">নোট (ঐচ্ছিক)</label>
                <Textarea 
                  value={formData.note}
                  onChange={e => setFormData(f => ({ ...f, note: e.target.value }))}
                  placeholder="বিস্তারিত লিখুন..."
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full">রিকোয়েস্ট পাঠান</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="রিকোয়েস্ট খুঁজুন..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Summary */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="gap-1">🟢 খোলা: {requests.filter(r => r.status === 'open').length}</Badge>
        <Badge variant="outline" className="gap-1">✅ পূরণ: {requests.filter(r => r.status === 'fulfilled').length}</Badge>
        <Badge variant="outline" className="gap-1">⛔ বন্ধ: {requests.filter(r => r.status === 'closed').length}</Badge>
      </div>

      {/* List */}
      {filteredRequests.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">কোনো রিকোয়েস্ট পাওয়া যায়নি</p>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(req => (
            <Card key={req.id} className={`border shadow-elegant transition-all ${
              req.status === 'fulfilled' ? 'border-accent/30 bg-accent/5' : 
              req.status === 'closed' ? 'opacity-60' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 flex-shrink-0 cursor-pointer" onClick={() => navigate(`/user/${req.requester_id}`)}>
                    <AvatarImage src={req.requester?.profile_image || ''} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {req.requester?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{req.requester?.full_name}</span>
                      <Badge variant={req.status === 'open' ? 'default' : req.status === 'fulfilled' ? 'secondary' : 'outline'} className="text-[10px]">
                        {req.status === 'open' ? 'খোলা' : req.status === 'fulfilled' ? 'পূরণ' : 'বন্ধ'}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1 text-foreground">
                      <strong>{req.variety?.name || req.variety_name}</strong>
                      {req.quantity > 1 && <span className="text-muted-foreground"> × {req.quantity}</span>}
                    </p>
                    {req.note && <p className="text-xs text-muted-foreground mt-1">{req.note}</p>}
                    {req.fulfiller && (
                      <p className="text-xs text-accent mt-1">পূরণকারী: {req.fulfiller.full_name}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(req.created_at).toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {req.status === 'open' && req.requester_id !== profile?.id && (
                      <Button size="sm" variant="outline" className="text-xs gap-1 border-accent text-accent h-8" onClick={() => handleFulfill(req.id)}>
                        <Check className="w-3 h-3" /> দিতে পারি
                      </Button>
                    )}
                    {req.status === 'open' && req.requester_id === profile?.id && (
                      <Button size="sm" variant="outline" className="text-xs gap-1 h-8" onClick={() => handleClose(req.id)}>
                        <X className="w-3 h-3" /> বন্ধ
                      </Button>
                    )}
                    {req.requester_id === profile?.id && (
                      <Button size="sm" variant="ghost" className="text-xs text-destructive h-8" onClick={() => handleDelete(req.id)}>
                        ডিলিট
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GiftRequests;
