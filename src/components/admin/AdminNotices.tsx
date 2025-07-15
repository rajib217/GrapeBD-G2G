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

interface Notice {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

const AdminNotices = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
      toast({
        title: "ত্রুটি",
        description: "নোটিশ লোড করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingNotice) {
        // Update existing notice
        const { error } = await supabase
          .from('notices')
          .update(formData)
          .eq('id', editingNotice.id);

        if (error) throw error;
        
        toast({
          title: "সফল",
          description: "নোটিশ আপডেট করা হয়েছে",
        });
      } else {
        // Get current user's profile ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (!profile) throw new Error('Profile not found');

        // Create new notice
        const { error } = await supabase
          .from('notices')
          .insert([{ ...formData, created_by: profile.id }]);

        if (error) throw error;
        
        toast({
          title: "সফল",
          description: "নতুন নোটিশ তৈরি করা হয়েছে",
        });
      }

      setIsDialogOpen(false);
      setEditingNotice(null);
      setFormData({ title: '', content: '', is_active: true });
      fetchNotices();
    } catch (error) {
      console.error('Error saving notice:', error);
      toast({
        title: "ত্রুটি",
        description: "নোটিশ সেভ করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      is_active: notice.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই নোটিশটি মুছে ফেলতে চান?')) return;

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "সফল",
        description: "নোটিশ মুছে ফেলা হয়েছে",
      });
      
      fetchNotices();
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast({
        title: "ত্রুটি",
        description: "নোটিশ মুছতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const toggleActiveStatus = async (notice: Notice) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_active: !notice.is_active })
        .eq('id', notice.id);

      if (error) throw error;
      
      toast({
        title: "সফল",
        description: `নোটিশ ${!notice.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`,
      });
      
      fetchNotices();
    } catch (error) {
      console.error('Error toggling notice status:', error);
      toast({
        title: "ত্রুটি",
        description: "নোটিশ স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const filteredNotices = notices.filter(notice =>
    notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">নোটিশ ম্যানেজমেন্ট</h2>
          <p className="text-muted-foreground">সিস্টেমের নোটিশ এবং ঘোষণা ব্যবস্থাপনা</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingNotice(null);
              setFormData({ title: '', content: '', is_active: true });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              নতুন নোটিশ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNotice ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ তৈরি'}</DialogTitle>
              <DialogDescription>
                নোটিশের তথ্য দিন
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">নোটিশের শিরোনাম *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="উদাহরণ: গুরুত্বপূর্ণ ঘোষণা"
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">নোটিশের বিষয়বস্তু *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="নোটিশের বিস্তারিত বিষয়বস্তু লিখুন..."
                  className="min-h-32"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">সক্রিয় নোটিশ</Label>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingNotice ? 'আপডেট করুন' : 'তৈরি করুন'}
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
          placeholder="নোটিশ খুঁজুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {filteredNotices.map((notice) => (
          <Card key={notice.id} className={!notice.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{notice.title}</CardTitle>
                  <CardDescription>
                    তৈরি: {new Date(notice.created_at).toLocaleDateString('bn-BD')} |
                    আপডেট: {new Date(notice.updated_at).toLocaleDateString('bn-BD')}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={notice.is_active ? 'default' : 'secondary'}>
                    {notice.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(notice)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActiveStatus(notice)}
                    >
                      {notice.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(notice.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap line-clamp-3">
                  {notice.content}
                </p>
              </div>
              {notice.content.length > 200 && (
                <Button
                  variant="link"
                  className="p-0 h-auto mt-2"
                  onClick={() => {
                    // Show full content in a dialog or expand inline
                    alert(notice.content); // Simple implementation, can be improved
                  }}
                >
                  আরো পড়ুন...
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">কোনো নোটিশ পাওয়া যায়নি</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{notices.length}</div>
            <p className="text-sm text-muted-foreground">মোট নোটিশ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{notices.filter(n => n.is_active).length}</div>
            <p className="text-sm text-muted-foreground">সক্রিয় নোটিশ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{notices.filter(n => !n.is_active).length}</div>
            <p className="text-sm text-muted-foreground">নিষ্ক্রিয় নোটিশ</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotices;