import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award, Send, Package, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeaderEntry {
  profileId: string;
  name: string;
  image: string | null;
  count: number;
}

const Leaderboard = () => {
  const [topSenders, setTopSenders] = useState<LeaderEntry[]>([]);
  const [topReceivers, setTopReceivers] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const [giftsRes, profilesRes] = await Promise.all([
        supabase.from('gifts').select('sender_id, receiver_id, status'),
        supabase.from('profiles').select('id, full_name, profile_image').eq('status', 'active'),
      ]);

      const gifts = giftsRes.data || [];
      const profiles = profilesRes.data || [];
      const profileMap = new Map(profiles.map(p => [p.id, p]));

      // Count sends
      const sendCounts: Record<string, number> = {};
      const recvCounts: Record<string, number> = {};
      
      gifts.forEach(g => {
        if (g.status !== 'cancelled') {
          sendCounts[g.sender_id] = (sendCounts[g.sender_id] || 0) + 1;
          recvCounts[g.receiver_id] = (recvCounts[g.receiver_id] || 0) + 1;
        }
      });

      const buildLeader = (counts: Record<string, number>): LeaderEntry[] =>
        Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([id, count]) => {
            const p = profileMap.get(id);
            return {
              profileId: id,
              name: p?.full_name || 'Unknown',
              image: p?.profile_image || null,
              count,
            };
          });

      setTopSenders(buildLeader(sendCounts));
      setTopReceivers(buildLeader(recvCounts));
    } catch (err) {
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">{rank + 1}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 0) return 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30';
    if (rank === 1) return 'bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/30';
    if (rank === 2) return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30';
    return 'bg-card border-border';
  };

  const renderList = (entries: LeaderEntry[], type: 'sent' | 'received') => {
    if (entries.length === 0) {
      return <p className="text-center text-muted-foreground py-8">এখনো কোনো ডেটা নেই</p>;
    }

    return (
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div
            key={entry.profileId}
            onClick={() => navigate(`/user/${entry.profileId}`)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${getRankBg(i)}`}
          >
            <div className="flex-shrink-0">{getRankIcon(i)}</div>
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={entry.image || ''} alt={entry.name} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {entry.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
            </div>
            <Badge variant="secondary" className="flex-shrink-0 gap-1 text-xs">
              {type === 'sent' ? <Send className="w-3 h-3" /> : <Package className="w-3 h-3" />}
              {entry.count}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-primary" />
        লিডারবোর্ড
      </h2>

      <Tabs defaultValue="senders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="senders" className="gap-1 text-xs md:text-sm">
            <Send className="w-3.5 h-3.5" /> সর্বোচ্চ গিফটদাতা
          </TabsTrigger>
          <TabsTrigger value="receivers" className="gap-1 text-xs md:text-sm">
            <Package className="w-3.5 h-3.5" /> সর্বোচ্চ গিফটগ্রহীতা
          </TabsTrigger>
        </TabsList>
        <TabsContent value="senders" className="mt-3">
          {renderList(topSenders, 'sent')}
        </TabsContent>
        <TabsContent value="receivers" className="mt-3">
          {renderList(topReceivers, 'received')}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard;
