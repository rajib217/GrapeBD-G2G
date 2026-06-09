import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Skull, Gift as GiftIcon, Send, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Props {
  roundId: string | null;
  roundTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Row {
  id: string;
  status: string;
  quantity: number;
  died_at: string | null;
  death_reason: string | null;
  death_note: string | null;
  death_image: string | null;
  received_at: string | null;
  receiver: { id: string; full_name: string | null; profile_image: string | null } | null;
  sender: { id: string; full_name: string | null } | null;
  variety: { id: string; name: string; thumbnail_image: string | null } | null;
}

const statusLabels: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  approved: 'অনুমোদিত',
  sent: 'পাঠানো হয়েছে',
  received: 'গ্রহণ করা হয়েছে',
  died: 'মারা গেছে',
  rejected: 'প্রত্যাখ্যাত',
  cancelled: 'বাতিল',
};

const statusVariant = (s: string): any => {
  if (s === 'died' || s === 'rejected' || s === 'cancelled') return 'destructive';
  if (s === 'received') return 'default';
  return 'secondary';
};

const StatusIcon = ({ s }: { s: string }) => {
  if (s === 'died') return <Skull className="h-3 w-3" />;
  if (s === 'received') return <CheckCircle className="h-3 w-3" />;
  if (s === 'sent') return <Send className="h-3 w-3" />;
  if (s === 'pending' || s === 'approved') return <Clock className="h-3 w-3" />;
  return <XCircle className="h-3 w-3" />;
};

const RoundMembersDialog = ({ roundId, roundTitle, open, onOpenChange }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !roundId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('gifts')
        .select(`
          id, status, quantity, died_at, death_reason, death_note, death_image, received_at,
          receiver:profiles!gifts_receiver_id_fkey(id, full_name, profile_image),
          sender:profiles!gifts_sender_id_fkey(id, full_name),
          variety:varieties(id, name, thumbnail_image)
        `)
        .eq('gift_round_id', roundId)
        .order('created_at', { ascending: false });
      if (!error) setRows((data as any) || []);
      setLoading(false);
    })();
  }, [roundId, open]);

  const diedCount = rows.filter(r => r.status === 'died').length;
  const receivedCount = rows.filter(r => r.status === 'received').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{roundTitle} — সদস্য ও চারার অবস্থা</DialogTitle>
          <DialogDescription>
            মোট: {rows.length} | গ্রহণ: {receivedCount} | মৃত: {diedCount}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">লোড হচ্ছে...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">এই রাউন্ডে কোনো গিফট নেই</div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={r.receiver?.profile_picture || undefined} />
                  <AvatarFallback>{r.receiver?.full_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-medium text-sm">{r.receiver?.full_name || 'অজানা'}</p>
                      <p className="text-xs text-muted-foreground">
                        প্রেরক: {r.sender?.full_name || 'অজানা'}
                      </p>
                    </div>
                    <Badge variant={statusVariant(r.status)} className="gap-1">
                      <StatusIcon s={r.status} />
                      {statusLabels[r.status] || r.status}
                    </Badge>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {r.variety?.thumbnail_image && (
                      <img src={r.variety.thumbnail_image} alt={r.variety.name} className="w-6 h-6 object-cover rounded" />
                    )}
                    <span>{r.variety?.name || 'অজানা জাত'}</span>
                    <Badge variant="outline">{r.quantity} টি</Badge>
                  </div>

                  {r.status === 'died' && (
                    <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/30 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-destructive font-medium">
                        <Skull className="h-3 w-3" /> চারা মারা গেছে
                      </div>
                      {r.died_at && (
                        <div className="text-muted-foreground">
                          তারিখ: {new Date(r.died_at).toLocaleDateString('bn-BD')}
                        </div>
                      )}
                      {r.death_reason && <div><span className="font-medium">কারণ:</span> {r.death_reason}</div>}
                      {r.death_note && <div><span className="font-medium">নোট:</span> {r.death_note}</div>}
                      {r.death_image && (
                        <img src={r.death_image} alt="death" className="mt-1 max-h-40 rounded" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RoundMembersDialog;
