import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Play, Pause, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GiftRound {
  id: string;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface Variety {
  id: string;
  name: string;
  thumbnail_image?: string;
  total_quantity?: number;
}

interface GiftRoundVariety {
  variety_id: string;
  quantity: number;
}

const AdminGiftRounds = () => {
  const [giftRounds, setGiftRounds] = useState<GiftRound[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<GiftRound | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_active: true
  });
  const [selectedVarieties, setSelectedVarieties] = useState<GiftRoundVariety[]>([]);
  const [selectedVarietyId, setSelectedVarietyId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchGiftRounds();
    fetchVarieties();
  }, []);

  const fetchGiftRounds = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_rounds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGiftRounds(data || []);
    } catch (error) {
      console.error('Error fetching gift rounds:', error);
      toast({
        title: "ত্রুটি",
        description: "গিফট রাউন্ড লোড করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVarieties = async () => {
    try {
      // First get varieties
      const { data: varietiesData, error: varietiesError } = await supabase
        .from('varieties')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (varietiesError) throw varietiesError;

      // Then get total quantities for each variety
      const varietiesWithQuantities = await Promise.all(
        (varietiesData || []).map(async (variety) => {
          const { data: stockData, error: stockError } = await supabase
            .from('user_stocks')
            .select('quantity')
            .eq('variety_id', variety.id);

          if (stockError) {
            console.error('Error fetching stock for variety:', variety.name, stockError);
            return { ...variety, total_quantity: 0 };
          }

          const totalQuantity = stockData?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
          return { ...variety, total_quantity: totalQuantity };
        })
      );

      setVarieties(varietiesWithQuantities);
    } catch (error) {
      console.error('Error fetching varieties:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRound) {
        // Update existing gift round
        const { error } = await supabase
          .from('gift_rounds')
          .update(formData)
          .eq('id', editingRound.id);

        if (error) throw error;
        
        toast({
          title: "সফল",
          description: "গিফট রাউন্ড আপডেট করা হয়েছে",
        });
      } else {
        // Get current user's profile ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (!profile) throw new Error('Profile not found');

        // Create new gift round
        const { error } = await supabase
          .from('gift_rounds')
          .insert([{ ...formData, created_by: profile.id }]);

        if (error) throw error;
        
        toast({
          title: "সফল",
          description: "নতুন গিফট রাউন্ড তৈরি করা হয়েছে",
        });
      }

      setIsDialogOpen(false);
      setEditingRound(null);
      setFormData({ title: '', description: '', is_active: true });
      setSelectedVarieties([]);
      setSelectedVarietyId('');
      setSelectedQuantity('');
      fetchGiftRounds();
    } catch (error) {
      console.error('Error saving gift round:', error);
      toast({
        title: "ত্রুটি",
        description: "গিফট রাউন্ড সেভ করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (round: GiftRound) => {
    setEditingRound(round);
    setFormData({
      title: round.title,
      description: round.description || '',
      is_active: round.is_active
    });
    setSelectedVarieties([]);
    setSelectedVarietyId('');
    setSelectedQuantity('');
    setIsDialogOpen(true);
  };

  const addVarietyToRound = () => {
    if (!selectedVarietyId || !selectedQuantity) return;
    
    const quantity = parseInt(selectedQuantity);
    const variety = varieties.find(v => v.id === selectedVarietyId);
    
    if (!variety || quantity <= 0 || quantity > (variety.total_quantity || 0)) {
      toast({
        title: "ত্রুটি",
        description: "অবৈধ পরিমাণ। উপলব্ধ চারার চেয়ে বেশি দিতে পারবেন না।",
        variant: "destructive",
      });
      return;
    }

    // Check if variety already exists
    const existingIndex = selectedVarieties.findIndex(v => v.variety_id === selectedVarietyId);
    if (existingIndex >= 0) {
      const updatedVarieties = [...selectedVarieties];
      updatedVarieties[existingIndex].quantity = quantity;
      setSelectedVarieties(updatedVarieties);
    } else {
      setSelectedVarieties([...selectedVarieties, { variety_id: selectedVarietyId, quantity }]);
    }

    setSelectedVarietyId('');
    setSelectedQuantity('');
  };

  const removeVarietyFromRound = (varietyId: string) => {
    setSelectedVarieties(selectedVarieties.filter(v => v.variety_id !== varietyId));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই গিফট রাউন্ডটি মুছে ফেলতে চান?')) return;

    try {
      const { error } = await supabase
        .from('gift_rounds')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "সফল",
        description: "গিফট রাউন্ড মুছে ফেলা হয়েছে",
      });
      
      fetchGiftRounds();
    } catch (error) {
      console.error('Error deleting gift round:', error);
      toast({
        title: "ত্রুটি",
        description: "গিফট রাউন্ড মুছতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const toggleActiveStatus = async (round: GiftRound) => {
    try {
      const { error } = await supabase
        .from('gift_rounds')
        .update({ is_active: !round.is_active })
        .eq('id', round.id);

      if (error) throw error;
      
      toast({
        title: "সফল",
        description: `গিফট রাউন্ড ${!round.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`,
      });
      
      fetchGiftRounds();
    } catch (error) {
      console.error('Error toggling gift round status:', error);
      toast({
        title: "ত্রুটি",
        description: "স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const filteredRounds = giftRounds.filter(round =>
    round.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">গিফট রাউন্ড ম্যানেজমেন্ট</h2>
          <p className="text-muted-foreground">গিফট রাউন্ড তৈরি এবং ব্যবস্থাপনা</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingRound(null);
              setFormData({ title: '', description: '', is_active: true });
              setSelectedVarieties([]);
              setSelectedVarietyId('');
              setSelectedQuantity('');
            }}>
              <Plus className="h-4 w-4 mr-2" />
              নতুন গিফট রাউন্ড
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRound ? 'গিফট রাউন্ড সম্পাদনা' : 'নতুন গিফট রাউন্ড তৈরি'}</DialogTitle>
              <DialogDescription>
                গিফট রাউন্ডের তথ্য দিন
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">রাউন্ডের নাম *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="উদাহরণ: বসন্ত ২০২৪ গিফট রাউন্ড"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">বিবরণ</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="এই রাউন্ড সম্পর্কে বিস্তারিত তথ্য..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">সক্রিয় রাউন্ড</Label>
              </div>

              {/* Variety Selection Section */}
              <div className="space-y-4">
                <Label>এই রাউন্ডে কোন জাত অন্তর্ভুক্ত করবেন?</Label>
                
                {/* Add Variety Form */}
                <div className="grid grid-cols-3 gap-2">
                  <Select value={selectedVarietyId} onValueChange={setSelectedVarietyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="জাত নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {varieties.filter(v => (v.total_quantity || 0) > 0).map((variety) => (
                        <SelectItem key={variety.id} value={variety.id}>
                          <div className="flex items-center gap-2">
                            {variety.thumbnail_image && (
                              <img
                                src={variety.thumbnail_image}
                                alt={variety.name}
                                className="w-6 h-6 object-cover rounded"
                              />
                            )}
                            <span>{variety.name} ({variety.total_quantity || 0} টি)</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="পরিমাণ"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(e.target.value)}
                    min="1"
                  />
                  <Button type="button" onClick={addVarietyToRound} disabled={!selectedVarietyId || !selectedQuantity}>
                    যোগ করুন
                  </Button>
                </div>

                {/* Selected Varieties List */}
                {selectedVarieties.length > 0 && (
                  <div className="space-y-2">
                    <Label>নির্বাচিত জাতসমূহ:</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedVarieties.map((item) => {
                        const variety = varieties.find(v => v.id === item.variety_id);
                        return (
                          <div key={item.variety_id} className="flex items-center justify-between bg-muted p-2 rounded">
                            <div className="flex items-center gap-2">
                              {variety?.thumbnail_image && (
                                <img
                                  src={variety.thumbnail_image}
                                  alt={variety.name}
                                  className="w-6 h-6 object-cover rounded"
                                />
                              )}
                              <span className="text-sm">{variety?.name}</span>
                              <Badge variant="secondary">{item.quantity} টি</Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVarietyFromRound(item.variety_id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingRound ? 'আপডেট করুন' : 'তৈরি করুন'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="গিফট রাউন্ড খুঁজুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Gift Rounds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRounds.map((round) => (
          <Card key={round.id} className={!round.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{round.title}</CardTitle>
                  <CardDescription>
                    তৈরি: {new Date(round.created_at).toLocaleDateString('bn-BD')}
                  </CardDescription>
                </div>
                <Badge variant={round.is_active ? 'default' : 'secondary'}>
                  {round.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {round.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {round.description}
                </p>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(round)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActiveStatus(round)}
                  >
                    {round.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(round.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRounds.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">কোনো গিফট রাউন্ড পাওয়া যায়নি</p>
        </div>
      )}
    </div>
  );
};

export default AdminGiftRounds;