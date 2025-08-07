import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gift, Clock, Leaf } from "lucide-react";
import { useEffect, useState } from "react";

const AdminStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGifts: 0,
    activeRounds: 0,
    totalVarieties: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: totalUsers, error: usersError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (usersError) console.error("Error fetching users:", usersError);

      const { data: gifts, error: giftsError } = await supabase
        .from("gifts")
        .select("quantity");
      if (giftsError) console.error("Error fetching gifts:", giftsError);
      const totalGifts = gifts?.reduce((acc, gift) => acc + gift.quantity, 0) || 0;

      const { count: activeRounds, error: activeRoundsError } = await supabase
        .from("gift_rounds")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      if (activeRoundsError) console.error("Error fetching active rounds:", activeRoundsError);

      const { count: totalVarieties, error: varietiesError } = await supabase
        .from("varieties")
        .select("*", { count: "exact", head: true });
      if (varietiesError) console.error("Error fetching varieties:", varietiesError);

      setStats({
        totalUsers: totalUsers || 0,
        totalGifts: totalGifts,
        activeRounds: activeRounds || 0,
        totalVarieties: totalVarieties || 0,
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">মোট ব্যবহারকারী</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">মোট চারা বিতরণ</CardTitle>
          <Gift className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalGifts}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">সক্রিয় গিফট রাউন্ড</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeRounds}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">মোট জাত</CardTitle>
          <Leaf className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalVarieties}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;