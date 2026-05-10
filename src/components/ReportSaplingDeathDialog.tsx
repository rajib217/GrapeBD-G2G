import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skull, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageCompression';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  giftId: string;
  varietyName?: string;
  onReported?: () => void;
}

const REASONS = [
  'পানি/আর্দ্রতা সংক্রান্ত সমস্যা',
  'পোকামাকড় বা রোগ',
  'প্রতিকূল আবহাওয়া',
  'মাটি/পট সমস্যা',
  'পরিবহনে ক্ষতি',
  'অজানা কারণ',
  'অন্যান্য',
];

const ReportSaplingDeathDialog = ({ open, onOpenChange, giftId, varietyName, onReported }: Props) => {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason(''); setNote(''); setImageFile(null);
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast({ title: 'কারণ নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const compressed = await compressImage(imageFile);
        const path = `gift-deaths/${giftId}-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from('post-images')
          .upload(path, compressed, { contentType: 'image/jpeg', upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('post-images').getPublicUrl(path);
        imageUrl = pub.publicUrl;
      }

      const { error } = await supabase
        .from('gifts')
        .update({
          status: 'died',
          died_at: new Date().toISOString(),
          death_reason: reason,
          death_note: note || null,
          death_image: imageUrl,
        })
        .eq('id', giftId);
      if (error) throw error;

      toast({ title: 'রিপোর্ট সফল', description: 'চারা মৃত্যুর তথ্য সংরক্ষণ করা হয়েছে।' });
      reset();
      onOpenChange(false);
      onReported?.();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'ত্রুটি', description: e.message || 'রিপোর্ট করতে সমস্যা হয়েছে', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-destructive" />
            চারা মারা গেছে রিপোর্ট
          </DialogTitle>
          <DialogDescription>
            {varietyName ? `"${varietyName}" - ` : ''}চারা মৃত্যুর তথ্য জানান। প্রেরক স্বয়ংক্রিয়ভাবে নোটিফিকেশন পাবেন।
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>কারণ <span className="text-destructive">*</span></Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="একটি কারণ বাছুন" /></SelectTrigger>
              <SelectContent>
                {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>বিস্তারিত নোট (ঐচ্ছিক)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="কীভাবে/কখন মারা গেছে তার সংক্ষিপ্ত বিবরণ..."
              rows={3}
            />
          </div>

          <div>
            <Label>ছবি (ঐচ্ছিক)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>বাতিল</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            রিপোর্ট জমা দিন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportSaplingDeathDialog;
