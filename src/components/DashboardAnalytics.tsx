import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Send, Package, TrendingUp, Users, Leaf, Award, BarChart3 } from 'lucide-react';

interface Stats {
  totalSent: number;
  totalReceived: number;
  pendingGifts: number;
  approvedGifts: number;
  sentGifts: number;
  receivedGifts: number;
  totalVarieties: number;
  totalMembers: number;
  myVarieties: number;
  topVariety: string | null;
}

interface MonthlyData {
  month: string;
  sent: number;
  received: number;
}

const DashboardAnalytics = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalSent: 0, totalReceived: 0, pendingGifts: 0, approvedGifts: 0,
    sentGifts: 0, receivedGifts: 0, totalVarieties: 0, totalMembers: 0,
    myVarieties: 0, topVariety: null
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) fetchStats();
  }, [profile?.id]);

  const fetchStats = async () => {
    if (!profile?.id) return;
    try {
      const [sentRes, recvRes, varietiesRes, membersRes, myVarRes, sentGiftsRes] = await Promise.all([
        supabase.from('gifts').select('id, status, variety_id').eq('sender_id', profile.id),
        supabase.from('gifts').select('id, status, variety_id, created_at').eq('receiver_id', profile.id),
        supabase.from('varieties').select('id').eq('is_active', true),
        supabase.from('profiles').select('id').eq('status', 'active'),
        supabase.from('user_varieties').select('id').eq('user_id', profile.id),
        supabase.from('gifts').select('id, created_at, variety_id').eq('sender_id', profile.id),
      ]);

      const sent = sentRes.data || [];
      const recv = recvRes.data || [];

      // Find top variety
      const varietyCounts: Record<string, number> = {};
      [...sent, ...recv].forEach(g => {
        varietyCounts[g.variety_id] = (varietyCounts[g.variety_id] || 0) + 1;
      });
      let topVarietyId: string | null = null;
      let maxCount = 0;
      Object.entries(varietyCounts).forEach(([id, count]) => {
        if (count > maxCount) { maxCount = count; topVarietyId = id; }
      });

      let topVarietyName: string | null = null;
      if (topVarietyId) {
        const { data: vData } = await supabase.from('varieties').select('name').eq('id', topVarietyId).single();
        topVarietyName = vData?.name || null;
      }

      // Monthly data (last 6 months)
      const months: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = d.toLocaleDateString('bn-BD', { month: 'short', year: '2-digit' });
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        const sentCount = (sentGiftsRes.data || []).filter(g => g.created_at?.startsWith(yearMonth)).length;
        const recvCount = recv.filter(g => g.created_at?.startsWith(yearMonth)).length;
        months.push({ month: monthStr, sent: sentCount, received: recvCount });
      }

      setStats({
        totalSent: sent.length,
        totalReceived: recv.length,
        pendingGifts: [...sent, ...recv].filter(g => g.status === 'pending').length,
        approvedGifts: [...sent, ...recv].filter(g => g.status === 'approved').length,
        sentGifts: [...sent, ...recv].filter(g => g.status === 'sent').length,
        receivedGifts: [...sent, ...recv].filter(g => g.status === 'received').length,
        totalVarieties: varietiesRes.data?.length || 0,
        totalMembers: membersRes.data?.length || 0,
        myVarieties: myVarRes.data?.length || 0,
        topVariety: topVarietyName,
      });
      setMonthlyData(months);
    } catch (err) {
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const maxBar = Math.max(...monthlyData.map(m => Math.max(m.sent, m.received)), 1);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-primary" />
        ড্যাশবোর্ড
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-none shadow-elegant">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Send className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalSent}</p>
              <p className="text-xs text-muted-foreground">পাঠানো গিফট</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalReceived}</p>
              <p className="text-xs text-muted-foreground">পাওয়া গিফট</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Leaf className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.myVarieties}</p>
              <p className="text-xs text-muted-foreground">আমার জাত</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Users className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalMembers}</p>
              <p className="text-xs text-muted-foreground">মোট সদস্য</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card className="border-none shadow-elegant">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">গিফট স্ট্যাটাস</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 border-yellow-300 text-yellow-700 dark:text-yellow-400">
              ⏳ পেন্ডিং: {stats.pendingGifts}
            </Badge>
            <Badge variant="outline" className="gap-1 border-blue-300 text-blue-700 dark:text-blue-400">
              ✅ অনুমোদিত: {stats.approvedGifts}
            </Badge>
            <Badge variant="outline" className="gap-1 border-purple-300 text-purple-700 dark:text-purple-400">
              📦 প্রেরিত: {stats.sentGifts}
            </Badge>
            <Badge variant="outline" className="gap-1 border-green-300 text-green-700 dark:text-green-400">
              🎉 প্রাপ্ত: {stats.receivedGifts}
            </Badge>
          </div>
          {stats.topVariety && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="w-4 h-4 text-primary" />
              <span>সবচেয়ে জনপ্রিয় জাত: <strong className="text-foreground">{stats.topVariety}</strong></span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Chart */}
      <Card className="border-none shadow-elegant">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            মাসিক কার্যকলাপ (শেষ ৬ মাস)
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-end gap-2 h-32">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end justify-center h-24">
                  <div
                    className="w-2.5 md:w-3 rounded-t bg-primary/80 transition-all duration-500"
                    style={{ height: `${(m.sent / maxBar) * 100}%`, minHeight: m.sent > 0 ? '4px' : '0' }}
                    title={`পাঠানো: ${m.sent}`}
                  />
                  <div
                    className="w-2.5 md:w-3 rounded-t bg-accent/80 transition-all duration-500"
                    style={{ height: `${(m.received / maxBar) * 100}%`, minHeight: m.received > 0 ? '4px' : '0' }}
                    title={`পাওয়া: ${m.received}`}
                  />
                </div>
                <span className="text-[9px] md:text-[10px] text-muted-foreground truncate max-w-full">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-primary/80" /> পাঠানো</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-accent/80" /> পাওয়া</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardAnalytics;
