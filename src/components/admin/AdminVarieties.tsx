import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Upload, X, ExternalLink } from 'lucide-react';
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
import { compressImage } from '@/utils/imageCompression';

interface Variety {
  id: string;
  name: string;
  description?: string;
  thumbnail_image?: string;
  details_url?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  total_quantity?: number;
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
    details_url: '',
    is_active: true
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchVarieties();
  }, []);

  const fetchVarieties = async () => {
    try {
      // First get varieties
      const { data: varietiesData, error: varietiesError } = await supabase
        .from('varieties')
        .select('*')
        .order('created_at', { ascending: false });

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
      let updatedFormData = { ...formData };

      // Upload image if file is selected
      if (selectedFile) {
        const imageUrl = await uploadImage();
        if (imageUrl) {
          updatedFormData.thumbnail_image = imageUrl;
        }
      }

      if (editingVariety) {
        // Update existing variety
        const { error } = await supabase
          .from('varieties')
          .update(updatedFormData)
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
          .insert([updatedFormData]);

        if (error) throw error;
        
        toast({
          title: "সফল",
          description: "নতুন জাত যোগ করা হয়েছে",
        });
      }

      setIsDialogOpen(false);
      setEditingVariety(null);
      setFormData({ name: '', description: '', thumbnail_image: '', details_url: '', is_active: true });
      removeSelectedImage();
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
      details_url: variety.details_url || '',
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "ত্রুটি",
          description: "শুধুমাত্র ছবি ফাইল আপলোড করুন",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const compressedFile = await compressImage(selectedFile, 200); // Compress to 200KB

      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `variety-${Date.now()}.${fileExt}`;
      const filePath = `varieties/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures') // Assuming 'profile-pictures' bucket is used for varieties too
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "ত্রুটি",
        description: "ছবি আপলোড করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">জাত ম্যানেজমেন্ট</h2>
          <p className="text-muted-foreground text-sm sm:text-base">আঙ্গুরের জাত যোগ, সম্পাদনা এবং ব্যবস্থাপনা</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full sm:w-auto" 
              size="lg"
              onClick={() => {
                setEditingVariety(null);
                setFormData({ name: '', description: '', thumbnail_image: '', details_url: '', is_active: true });
                removeSelectedImage();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              নতুন জাত যোগ করুন
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{editingVariety ? 'জাত সম্পাদনা' : 'নতুন জাত যোগ করুন'}</DialogTitle>
              <DialogDescription className="text-sm">
                আঙ্গুরের জাতের তথ্য দিন
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">জাতের নাম *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="উদাহরণ: রেড গ্লোব"
                  className="mt-1"
                  required
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">জাতের ছবি</Label>
                
                {/* File Input */}
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      ছবি নির্বাচন করুন
                    </Button>
                    
                    {selectedFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto"
                        onClick={removeSelectedImage}
                      >
                        <X className="h-4 w-4 mr-2" />
                        ছবি সরান
                      </Button>
                    )}
                  </div>

                  {/* Image Preview */}
                  {(previewUrl || formData.thumbnail_image) && (
                    <div className="relative">
                      <img
                        src={previewUrl || formData.thumbnail_image}
                        alt="Preview"
                        className="w-full max-w-xs h-auto object-cover rounded-lg border"
                      />
                      {selectedFile && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          ফাইল: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Manual URL Input */}
                <div className="border-t pt-3">
                  <Label htmlFor="thumbnail" className="text-xs text-muted-foreground">অথবা ছবির লিংক দিন</Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail_image}
                    onChange={(e) => setFormData({ ...formData, thumbnail_image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="details_url" className="text-sm font-medium">বিস্তারিত লিংক</Label>
                <Input
                  id="details_url"
                  value={formData.details_url}
                  onChange={(e) => setFormData({ ...formData, details_url: e.target.value })}
                  placeholder="https://example.com/variety-details"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">জাত সম্পর্কে বিস্তারিত জানার জন্য ওয়েবসাইট লিংক</p>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">বিবরণ</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="জাতের বিস্তারিত তথ্য..."
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="text-sm font-medium">সক্রিয় জাত</Label>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto" 
                  size="lg"
                  disabled={uploading}
                >
                  {uploading ? 'আপলোড হচ্ছে...' : (editingVariety ? 'আপডেট করুন' : 'যোগ করুন')}
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
              <div className="mb-3">
                {variety.thumbnail_image && (
                  <img
                    src={variety.thumbnail_image}
                    alt={variety.name}
                    className="w-full max-w-[50%] h-auto object-cover rounded-sm mb-3"
                  />
                )}
                
                {variety.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {variety.description}
                  </p>
                )}
                
                <div className="text-sm font-medium text-muted-foreground">
                  মোট পরিমাণ: <span className="font-bold text-foreground">{variety.total_quantity || 0} টি</span>
                </div>

                {variety.details_url && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => window.open(variety.details_url, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      বিস্তারিত দেখুন
                    </Button>
                  </div>
                )}
              </div>
              
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