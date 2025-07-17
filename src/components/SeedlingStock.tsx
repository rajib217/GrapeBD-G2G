import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pen, Trash2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Stock {
  id: string;
  quantity: number;
  notes: string | null;
  variety: {
    id: string;
    name: string;
    description: string | null;
    thumbnail_image: string | null;
  };
}

const SeedlingStock = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchStocks = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_stocks')
        .select(`
          id,
          quantity,
          notes,
          variety:varieties(id, name, description, thumbnail_image)
        `)
        .eq('user_id', profile.id)
        .gt('quantity', 0);

      if (error) throw error;
      setStocks(data || []);
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'স্টক লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [profile?.id]);

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock);
    setEditQuantity(stock.quantity.toString());
    setEditNotes(stock.notes || '');
  };

  const handleUpdate = async () => {
    if (!editingStock) return;

    try {
      const { error } = await supabase
        .from('user_stocks')
        .update({
          quantity: parseInt(editQuantity),
          notes: editNotes.trim() || null,
        })
        .eq('id', editingStock.id);

      if (error) throw error;

      toast({
        title: 'সফল',
        description: 'স্টক আপডেট করা হয়েছে',
      });

      setEditingStock(null);
      fetchStocks();
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'স্টক আপডেট করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (stockId: string) => {
    try {
      const { error } = await supabase
        .from('user_stocks')
        .delete()
        .eq('id', stockId);

      if (error) throw error;

      toast({
        title: 'সফল',
        description: 'স্টক মুছে ফেলা হয়েছে',
      });

      fetchStocks();
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'স্টক মুছতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">লোড হচ্ছে...</div>;
  }

  if (stocks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">কোন চারা নেই</h3>
          <p className="text-gray-500">আপনার স্টকে এখনো কোন চারা যোগ করা হয়নি</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stocks.map((stock) => (
          <Card key={stock.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {stock.variety.thumbnail_image && (
                    <img
                      src={stock.variety.thumbnail_image}
                      alt={stock.variety.name}
                      className="w-8 h-8 object-cover rounded-sm flex-shrink-0"
                    />
                  )}
                  <CardTitle className="text-lg">{stock.variety.name}</CardTitle>
                </div>
                <Badge variant="secondary">{stock.quantity} টি</Badge>
              </div>
              {stock.variety.description && (
                <CardDescription>{stock.variety.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {stock.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">নোট:</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{stock.notes}</p>
                </div>
              )}
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(stock)}
                    >
                      <Pen className="h-4 w-4 mr-1" />
                      সম্পাদনা
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>স্টক সম্পাদনা করুন</DialogTitle>
                      <DialogDescription>
                        {stock.variety.name} এর তথ্য পরিবর্তন করুন
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="quantity">পরিমাণ</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="0"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">নোট (ঐচ্ছিক)</Label>
                        <Textarea
                          id="notes"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="কোন বিশেষ তথ্য থাকলে লিখুন"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleUpdate}>আপডেট করুন</Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingStock(null)}
                        >
                          বাতিল
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(stock.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  মুছুন
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SeedlingStock;