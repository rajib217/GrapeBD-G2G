import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, Edit, X, Check, Filter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  edited_by_admin: boolean;
  post_id: string;
  profiles: {
    full_name: string;
    profile_image: string | null;
  };
}

interface Profile {
  id: string;
  full_name: string;
}

const AdminComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  useEffect(() => {
    fetchUsers();
    fetchComments();
  }, []);

  useEffect(() => {
    fetchComments();
  }, [selectedUserId, startDate, endDate]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("status", "active")
      .order("full_name");

    if (error) {
      toast.error("ইউজার লোড করতে সমস্যা হয়েছে");
      return;
    }
    setUsers(data || []);
  };

  const fetchComments = async () => {
    let query = supabase
      .from("comments")
      .select(`id, content, created_at, edited_by_admin, post_id, user_id`);

    if (selectedUserId !== "all") {
      query = query.eq("user_id", selectedUserId);
    }
    if (startDate) {
      query = query.gte("created_at", startDate.toISOString());
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endOfDay.toISOString());
    }

    const { data: commentsData, error } = await query.order("created_at", { ascending: false });

    if (error) {
      toast.error("কমেন্ট লোড করতে সমস্যা হয়েছে");
      setLoading(false);
      return;
    }

    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, profile_image")
      .in("id", userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

    const commentsWithProfiles = commentsData.map(comment => ({
      ...comment,
      profiles: profilesMap.get(comment.user_id) || { full_name: "Unknown", profile_image: null }
    }));

    setComments(commentsWithProfiles);
    setLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("আপনি কি এই কমেন্টটি মুছে ফেলতে চান?")) return;

    const { error } = await supabase.from("comments").delete().eq("id", commentId);

    if (error) {
      toast.error("কমেন্ট মুছতে সমস্যা হয়েছে");
      return;
    }

    toast.success("কমেন্ট মুছে ফেলা হয়েছে");
    fetchComments();
  };

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const saveCommentEdit = async () => {
    if (!editingCommentId) return;

    const { error } = await supabase
      .from("comments")
      .update({ content: editContent, edited_by_admin: true })
      .eq("id", editingCommentId);

    if (error) {
      toast.error("কমেন্ট আপডেট করতে সমস্যা হয়েছে");
      return;
    }

    toast.success("কমেন্ট আপডেট হয়েছে");
    cancelEdit();
    fetchComments();
  };

  if (loading) {
    return <div className="p-4">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            কমেন্ট ফিল্টার
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ইউজার</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="সব ইউজার" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব ইউজার</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">শুরুর তারিখ</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? startDate.toLocaleDateString('bn-BD') : "তারিখ নির্বাচন করুন"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">শেষ তারিখ</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate ? endDate.toLocaleDateString('bn-BD') : "তারিখ নির্বাচন করুন"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedUserId("all");
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              ফিল্টার রিসেট করুন
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>সকল কমেন্ট ম্যানেজমেন্ট ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comments.length === 0 && (
              <p className="text-muted-foreground text-center py-8">কোনো কমেন্ট পাওয়া যায়নি</p>
            )}
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.profiles.profile_image || ""} />
                      <AvatarFallback>{comment.profiles.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{comment.profiles.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString('bn-BD')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => startEditComment(comment)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteComment(comment.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveCommentEdit}>
                          <Check className="h-4 w-4 mr-1" />
                          সেভ করুন
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="h-4 w-4 mr-1" />
                          বাতিল
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm">{comment.content}</p>
                      {comment.edited_by_admin && (
                        <p className="text-xs text-muted-foreground mt-1">Edited By Admin</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminComments;
