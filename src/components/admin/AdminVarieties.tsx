import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Variety {
  id: string;
  name: string;
  description?: string;
  thumbnail_image?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

const AdminVarieties = () => {
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariety, setEditingVariety] = useState<Variety | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    thumbnail_image: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchVarieties();
  }, []);

  const fetchVarieties = async () => {
    try {
      const { data, error } = await supabase
        .from('varieties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVarieties(data || []);
    } catch (error) {
      console.error('Error fetching varieties:', error);
      toast({
        title: "ত্রুটি",
        description: "জাত লোড করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingVariety) {
        // Update existing variety
        const { error } = await supabase
          .from('varieties')
          .update(formData)
          .eq('id', editingVariety.id);

        if (error) throw error;
        
        toast({
          title: "সফল",
          description: "জাত আপডেট করা হয়েছে",
        });
      } else {
        // Create new variety
        const { error } = await supabase
          .from('varieties')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "সফল",
          description: "নতুন জাত যোগ করা হয়েছে",
        });
      }

      setIsDialogOpen(false);
      setEditingVariety(null);
      setFormData({ name: '', description: '', thumbnail_image: '', is_active: true });
      fetchVarieties();
    } catch (error) {
      console.error('Error saving variety:', error);
      toast({
        title: "ত্রুটি",
        description: "জাত সেভ করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (variety: Variety) => {
    setEditingVariety(variety);
    setFormData({
      name: variety.name,
      description: variety.description || '',
      thumbnail_image: variety.thumbnail_image || '',
      is_active: variety.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই জাতটি মুছে ফেলতে চান?')) return;

    try {
      const { error } = await supabase
        .from('varieties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "সফল",
        description: "জাত মুছে ফেলা হয়েছে",
      });
      
      fetchVarieties();
    } catch (error) {
      console.error('Error deleting variety:', error);
      toast({
        title: "ত্রুটি",
        description: "জাত মুছতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const toggleActiveStatus = async (variety: Variety) => {
    try {
      const { error } = await supabase
        .from('varieties')
        .update({ is_active: !variety.is_active })
        .eq('id', variety.id);

      if (error) throw error;
      
      toast({
        title: "সফল",
        description: `জাত ${!variety.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`,
      });
      
      fetchVarieties();
    } catch (error) {
      console.error('Error toggling variety status:', error);
      toast({
        title: "ত্রুটি",
        description: "স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const filteredVarieties = varieties.filter(variety =>
    variety.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">জাত ম্যানেজমেন্ট</h2>
          <p className="text-muted-foreground">আঙ্গুরের জাত যোগ, সম্পাদনা এবং ব্যবস্থাপনা</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingVariety(null);
              setFormData({ name: '', description: '', thumbnail_image: '', is_active: true });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              নতুন জাত যোগ করুন
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingVariety ? 'জাত সম্পাদনা' : 'নতুন জাত যোগ করুন'}</DialogTitle>
              <DialogDescription>
                আঙ্গুরের জাতের তথ্য দিন
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">জাতের নাম *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="উদাহরণ: রেড গ্লোব"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">বিবরণ</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="জাতের বিস্তারিত তথ্য..."
                />
              </div>
              <div>
                <Label htmlFor="thumbnail">ছবির লিংক</Label>
                <Input
                  id="thumbnail"
                  value={formData.thumbnail_image}
                  onChange={(e) => setFormData({ ...formData, thumbnail_image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">সক্রিয় জাত</Label>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingVariety ? 'আপডেট করুন' : 'যোগ করুন'}
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
          placeholder="জাত খুঁজুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Varieties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVarieties.map((variety) => (
          <Card key={variety.id} className={!variety.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{variety.name}</CardTitle>
                  <CardDescription>
                    {new Date(variety.created_at).toLocaleDateString('bn-BD')}
                  </CardDescription>
                </div>
                <Badge variant={variety.is_active ? 'default' : 'secondary'}>
                  {variety.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {variety.thumbnail_image && (
                <img
                  src={variety.thumbnail_image}
                  alt={variety.name}
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
              )}
              {variety.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {variety.description}
                </p>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(variety)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActiveStatus(variety)}
                  >
                    {variety.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(variety.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVarieties.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">কোনো জাত পাওয়া যায়নি</p>
        </div>
      )}
    </div>
  );
};

export default AdminVarieties;