import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Props {
  varietyId: string | null;
  onClose: () => void;
}

interface VarietyDetails {
  id: string;
  name: string;
  description: string | null;
  thumbnail_image: string | null;
  details_url: string | null;
}

interface OwnerProfile {
  id: string;
  full_name: string;
  profile_image: string | null;
  quantity?: number;
  source: 'personal' | 'stock';
}

const VarietyDetailsModal = ({ varietyId, onClose }: Props) => {
  const navigate = useNavigate();
  const [variety, setVariety] = useState<VarietyDetails | null>(null);
  const [owners, setOwners] = useState<OwnerProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!varietyId) return;
    setLoading(true);

    const load = async () => {
      const [vRes, uvRes, usRes] = await Promise.all([
        supabase.from('varieties').select('id,name,description,thumbnail_image,details_url').eq('id', varietyId).single(),
        supabase.from('user_varieties').select('user_id, profiles:user_id(id, full_name, profile_image)').eq('variety_id', varietyId),
        supabase.from('user_stocks').select('user_id, quantity, profiles:user_id(id, full_name, profile_image)').eq('variety_id', varietyId).gt('quantity', 0),
      ]);

      if (vRes.data) setVariety(vRes.data as VarietyDetails);

      const map = new Map<string, OwnerProfile>();
      (uvRes.data || []).forEach((row: any) => {
        if (row.profiles) {
          map.set(row.profiles.id, { ...row.profiles, source: 'personal' });
        }
      });
      (usRes.data || []).forEach((row: any) => {
        if (row.profiles) {
          const existing = map.get(row.profiles.id);
          map.set(row.profiles.id, {
            ...row.profiles,
            quantity: row.quantity,
            source: existing ? existing.source : 'stock',
          });
        }
      });
      setOwners(Array.from(map.values()));
      setLoading(false);
    };

    load();
  }, [varietyId]);

  return (
    <Dialog open={!!varietyId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{variety?.name || 'জাতের বিস্তারিত'}</DialogTitle>
          <DialogDescription>
            জাতের তথ্য ও যাদের কাছে এই জাত আছে
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>}

        {variety && (
          <div className="space-y-4">
            <div className="flex gap-4">
              {variety.thumbnail_image && (
                <img
                  src={variety.thumbnail_image}
                  alt={variety.name}
                  className="w-28 h-28 rounded-lg object-cover border"
                />
              )}
              <div className="flex-1 space-y-2">
                {variety.description && (
                  <p className="text-sm text-muted-foreground">{variety.description}</p>
                )}
                {variety.details_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={variety.details_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      বিস্তারিত দেখুন
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">
                যাদের কাছে এই জাত আছে ({owners.length})
              </h3>
              {owners.length === 0 ? (
                <p className="text-sm text-muted-foreground">কারো কাছে এই জাতের তথ্য পাওয়া যায়নি</p>
              ) : (
                <div className="space-y-2">
                  {owners.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        onClose();
                        navigate(`/user/${o.id}`);
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={o.profile_image || ''} />
                        <AvatarFallback>{o.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{o.full_name}</p>
                      </div>
                      {o.quantity !== undefined && (
                        <Badge variant="secondary">{o.quantity}টি</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VarietyDetailsModal;
