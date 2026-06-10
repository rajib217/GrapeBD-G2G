import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users, Gift, Leaf, Clock, Bell, MessageCircle, MessageSquare,
  HandHeart, Skull, CheckCircle2, Send, TrendingUp, UserPlus, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";

type Stat = {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  hint?: string;
};

const StatCard = ({ s }: { s: Stat }) => {
  const Icon = s.icon;
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-3 rounded-xl ${s.color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{s.label}</p>
          <p className="text-2xl font-bold">{s.value}</p>
          {s.hint && <p className="text-[10px] text-muted-foreground">{s.hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const AdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0, newUsersThisMonth: 0, admins: 0,
    totalGifts: 0, totalQuantity: 0, sent: 0, received: 0, died: 0, pending: 0,
    activeRounds: 0, totalRounds: 0,
    varieties: 0,
    posts: 0, comments: 0, messages: 0,
    notices: 0, activeNotices: 0,
    giftRequests: 0, pendingRequests: 0,
  });
  const [statusData, setStatusData] = useState<any[]>([]);
  const [roundData, setRoundData] = useState<any[]>([]);
  const [topReceivers, setTopReceivers] = useState<any[]>([]);
  const [topSenders, setTopSenders] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentGifts, setRecentGifts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        usersC, newUsersC, adminsC,
        giftsAll,
        roundsAll,
        varietiesC,
        postsC, commentsC, messagesC,
        noticesAll,
        giftReqsAll,
        recentUsersR, recentGiftsR,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString()),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("gifts").select("id,status,quantity,sender_id,receiver_id,gift_round_id,created_at"),
        supabase.from("gift_rounds").select("id,title,is_active"),
        supabase.from("varieties").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("notices").select("id,is_active"),
        supabase.from("gift_requests").select("id,status"),
        supabase.from("profiles").select("id,full_name,profile_image,created_at,role").order("created_at", { ascending: false }).limit(6),
        supabase.from("gifts").select("id,status,quantity,created_at,sender:profiles!gifts_sender_id_fkey(full_name,profile_image),receiver:profiles!gifts_receiver_id_fkey(full_name,profile_image),variety:varieties(name)").order("created_at", { ascending: false }).limit(6),
      ]);

      const gifts = giftsAll.data || [];
      const totalQuantity = gifts.reduce((a, g: any) => a + (g.quantity || 0), 0);
      const byStatus: Record<string, number> = {};
      gifts.forEach((g: any) => { byStatus[g.status] = (byStatus[g.status] || 0) + 1; });

      const rounds = roundsAll.data || [];
      const roundMap = new Map(rounds.map((r: any) => [r.id, r.title]));
      const byRound: Record<string, number> = {};
      gifts.forEach((g: any) => {
        const t = roundMap.get(g.gift_round_id) || "অন্যান্য";
        byRound[t as string] = (byRound[t as string] || 0) + (g.quantity || 0);
      });

      // Top senders/receivers by gift count (received status counted)
      const sendCount: Record<string, number> = {};
      const recvCount: Record<string, number> = {};
      gifts.forEach((g: any) => {
        if (g.sender_id) sendCount[g.sender_id] = (sendCount[g.sender_id] || 0) + (g.quantity || 0);
        if (g.receiver_id && g.status === "received") recvCount[g.receiver_id] = (recvCount[g.receiver_id] || 0) + (g.quantity || 0);
      });
      const topIds = Array.from(new Set([
        ...Object.entries(sendCount).sort((a,b)=>b[1]-a[1]).slice(0,5).map(e=>e[0]),
        ...Object.entries(recvCount).sort((a,b)=>b[1]-a[1]).slice(0,5).map(e=>e[0]),
      ]));
      let profilesById: Record<string, any> = {};
      if (topIds.length) {
        const { data } = await supabase.from("profiles").select("id,full_name,profile_image").in("id", topIds);
        profilesById = Object.fromEntries((data || []).map((p: any) => [p.id, p]));
      }
      const buildTop = (m: Record<string, number>) =>
        Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,count]) => ({
          ...(profilesById[id] || { full_name: "অজানা" }), count,
        }));

      const notices = noticesAll.data || [];
      const giftReqs = giftReqsAll.data || [];

      setStats({
        totalUsers: usersC.count || 0,
        newUsersThisMonth: newUsersC.count || 0,
        admins: adminsC.count || 0,
        totalGifts: gifts.length,
        totalQuantity,
        sent: byStatus["sent"] || 0,
        received: byStatus["received"] || 0,
        died: byStatus["died"] || 0,
        pending: byStatus["pending"] || 0,
        activeRounds: rounds.filter((r: any) => r.is_active).length,
        totalRounds: rounds.length,
        varieties: varietiesC.count || 0,
        posts: postsC.count || 0,
        comments: commentsC.count || 0,
        messages: messagesC.count || 0,
        notices: notices.length,
        activeNotices: notices.filter((n: any) => n.is_active).length,
        giftRequests: giftReqs.length,
        pendingRequests: giftReqs.filter((r: any) => r.status === "pending").length,
      });

      setStatusData(
        Object.entries(byStatus).map(([k, v]) => ({
          name: k === "pending" ? "অপেক্ষমান" : k === "sent" ? "প্রেরিত" : k === "received" ? "প্রাপ্ত" : k === "died" ? "মৃত" : k,
          value: v,
        }))
      );
      setRoundData(
        Object.entries(byRound).map(([k, v]) => ({ name: k, চারা: v })).slice(0, 10)
      );
      setTopSenders(buildTop(sendCount));
      setTopReceivers(buildTop(recvCount));
      setRecentUsers(recentUsersR.data || []);
      setRecentGifts(recentGiftsR.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const statCards: Stat[] = [
    { label: "মোট সদস্য", value: stats.totalUsers, icon: Users, color: "bg-blue-500", hint: `${stats.admins} জন এডমিন` },
    { label: "এই মাসে নতুন", value: stats.newUsersThisMonth, icon: UserPlus, color: "bg-emerald-500" },
    { label: "মোট গিফট এন্ট্রি", value: stats.totalGifts, icon: Gift, color: "bg-pink-500", hint: `${stats.totalQuantity} টি চারা` },
    { label: "প্রাপ্ত চারা", value: stats.received, icon: CheckCircle2, color: "bg-green-600" },
    { label: "প্রেরিত", value: stats.sent, icon: Send, color: "bg-indigo-500" },
    { label: "অপেক্ষমান", value: stats.pending, icon: Clock, color: "bg-amber-500" },
    { label: "মৃত চারা", value: stats.died, icon: Skull, color: "bg-red-500" },
    { label: "সক্রিয় রাউন্ড", value: stats.activeRounds, icon: Activity, color: "bg-purple-500", hint: `মোট ${stats.totalRounds}` },
    { label: "জাত", value: stats.varieties, icon: Leaf, color: "bg-teal-500" },
    { label: "চারা রিকোয়েস্ট", value: stats.giftRequests, icon: HandHeart, color: "bg-rose-500", hint: `${stats.pendingRequests} অপেক্ষমান` },
    { label: "পোস্ট", value: stats.posts, icon: MessageCircle, color: "bg-cyan-500", hint: `${stats.comments} কমেন্ট` },
    { label: "মেসেজ", value: stats.messages, icon: MessageSquare, color: "bg-fuchsia-500" },
    { label: "নোটিশ", value: stats.notices, icon: Bell, color: "bg-orange-500", hint: `${stats.activeNotices} সক্রিয়` },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {statCards.map((s) => <StatCard key={s.label} s={s} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> গিফট স্ট্যাটাস
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> রাউন্ড অনুযায়ী চারা
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roundData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="চারা" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">শীর্ষ প্রেরক</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topSenders.length === 0 && <p className="text-sm text-muted-foreground">কোন ডেটা নেই</p>}
            {topSenders.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 text-center font-bold text-muted-foreground">{i + 1}</span>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.profile_image} />
                  <AvatarFallback>{u.full_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{u.full_name}</span>
                <Badge variant="secondary">{u.count} টি</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">শীর্ষ গ্রাহক</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topReceivers.length === 0 && <p className="text-sm text-muted-foreground">কোন ডেটা নেই</p>}
            {topReceivers.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 text-center font-bold text-muted-foreground">{i + 1}</span>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.profile_image} />
                  <AvatarFallback>{u.full_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{u.full_name}</span>
                <Badge variant="secondary">{u.count} টি</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">সাম্প্রতিক সদস্য</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.profile_image} />
                  <AvatarFallback>{u.full_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("bn-BD")}</p>
                </div>
                {u.role === "admin" && <Badge>এডমিন</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">সাম্প্রতিক গিফট</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentGifts.map((g: any) => (
              <div key={g.id} className="flex items-center gap-2 text-sm">
                <Avatar className="h-7 w-7"><AvatarImage src={g.sender?.profile_image} /><AvatarFallback>{g.sender?.full_name?.[0] || "?"}</AvatarFallback></Avatar>
                <span className="truncate max-w-[80px]">{g.sender?.full_name}</span>
                <Send className="h-3 w-3 text-muted-foreground" />
                <Avatar className="h-7 w-7"><AvatarImage src={g.receiver?.profile_image} /><AvatarFallback>{g.receiver?.full_name?.[0] || "?"}</AvatarFallback></Avatar>
                <span className="truncate max-w-[80px]">{g.receiver?.full_name}</span>
                <Badge variant="outline" className="ml-auto text-xs">{g.variety?.name} ×{g.quantity}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
