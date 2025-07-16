import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Variety {
  id: string;
  name: string;
  description: string | null;
}

const AddSeedling = () => {
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [selectedVariety, setSelectedVariety] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchVarieties = async () => {
    try {
      const { data, error } = await supabase
        .from('varieties')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVarieties(data || []);
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'জাত লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchVarieties();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !selectedVariety || !quantity) return;

    setLoading(true);
    try {
      // Check if user already has this variety
      const { data: existingStock } = await supabase
        .from('user_stocks')
        .select('id, quantity')
        .eq('user_id', profile.id)
        .eq('variety_id', selectedVariety)
        .single();

      if (existingStock) {
        // Update existing stock
        const { error } = await supabase
          .from('user_stocks')
          .update({
            quantity: existingStock.quantity + parseInt(quantity),
            notes: notes.trim() || null,
          })
          .eq('id', existingStock.id);

        if (error) throw error;
      } else {
        // Create new stock entry
        const { error } = await supabase
          .from('user_stocks')
          .insert({
            user_id: profile.id,
            variety_id: selectedVariety,
            quantity: parseInt(quantity),
            notes: notes.trim() || null,
          });

        if (error) throw error;
      }

      toast({
        title: 'সফল',
        description: 'চারা সফলভাবে যোগ করা হয়েছে',
      });

      // Reset form
      setSelectedVariety('');
      setQuantity('');
      setNotes('');
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'চারা যোগ করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>নতুন চারা যোগ করুন</span>
          </CardTitle>
          <CardDescription>
            আপনার স্টকে নতুন চারা যোগ করুন বা বিদ্যমান চারার পরিমাণ বৃদ্ধি করুন
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="variety">জাত নির্বাচন করুন *</Label>
              <Select value={selectedVariety} onValueChange={setSelectedVariety}>
                <SelectTrigger>
                  <SelectValue placeholder="একটি জাত নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {varieties.map((variety) => (
                    <SelectItem key={variety.id} value={variety.id}>
                      <div>
                        <div className="font-medium">{variety.name}</div>
                        {variety.description && (
                          <div className="text-sm text-gray-500">{variety.description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">পরিমাণ *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="কতটি চারা যোগ করবেন?"
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">নোট (ঐচ্ছিক)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="চারা সম্পর্কে কোন বিশেষ তথ্য থাকলে লিখুন (যেমন: গাছের বয়স, অবস্থা ইত্যাদি)"
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !selectedVariety || !quantity}
            >
              {loading ? 'যোগ করা হচ্ছে...' : 'চারা যোগ করুন'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {varieties.length === 0 && (
        <Card className="mt-6">
          <CardContent className="text-center py-8">
            <p className="text-gray-600">
              কোন জাত পাওয়া যায়নি। অ্যাডমিনের সাথে যোগাযোগ করুন নতুন জাত যোগ করার জন্য।
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddSeedling;