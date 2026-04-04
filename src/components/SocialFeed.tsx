import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { compressPostImage } from '@/utils/imageCompression';
import { Camera, MessageCircle, Share2, Send, X, Loader2, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import FullscreenImageViewer from './FullscreenImageViewer';

interface Reaction {
  id: string;
  user_id: string;
  reaction_type: string;
}

interface CommentReaction {
  id: string;
  user_id: string;
  reaction_type: string;
  comment_id: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_comment_id: string | null;
  reply_to_user_name: string | null;
  profiles: {
    full_name: string;
    profile_image: string | null;
  };
  reactions: CommentReaction[];
  replies?: Comment[];
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  edited_by_admin?: boolean;
  profiles: {
    full_name: string;
    profile_image: string | null;
  };
  reactions: Reaction[];
  comments: Comment[];
}

// Facebook-style colorful emoji reactions
const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'লাইক', color: '#2078F4' },
  { type: 'love', emoji: '❤️', label: 'ভালোবাসা', color: '#F33E58' },
  { type: 'haha', emoji: '😂', label: 'হাহা', color: '#F7B125' },
  { type: 'wow', emoji: '😮', label: 'ওয়াও', color: '#F7B125' },
  { type: 'sad', emoji: '😢', label: 'দুঃখিত', color: '#F7B125' },
  { type: 'angry', emoji: '😡', label: 'রাগ', color: '#E9710F' },
];

const getReactionEmoji = (type: string) => REACTIONS.find(r => r.type === type)?.emoji || '👍';
const getReactionColor = (type: string) => REACTIONS.find(r => r.type === type)?.color || '#2078F4';
const getReactionLabel = (type: string) => REACTIONS.find(r => r.type === type)?.label || 'React';

const SocialFeed = () => {
  const { profile, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingImage, setEditingImage] = useState<File | null>(null);
  const [editingImagePreview, setEditingImagePreview] = useState<string | null>(null);
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; userName: string; postId: string } | null>(null);

  useEffect(() => {
    fetchPosts();
    
    const subscription = supabase
      .channel('social-feed-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comment_reactions' }, () => fetchPosts())
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`id, content, image_url, created_at, user_id, edited_by_admin, profiles ( full_name, profile_image )`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      const postIds = postsData?.map(p => p.id) || [];
      
      const [reactionsRes, commentsRes] = await Promise.all([
        supabase.from('reactions').select('*').in('post_id', postIds),
        supabase.from('comments').select('id, content, created_at, user_id, post_id, parent_comment_id, reply_to_user_name').in('post_id', postIds).order('created_at', { ascending: true }),
      ]);

      const commentIds = commentsRes.data?.map(c => c.id) || [];
      const commentUserIds = [...new Set(commentsRes.data?.map(c => c.user_id) || [])];

      const [commentProfilesRes, commentReactionsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, profile_image').in('id', commentUserIds),
        commentIds.length > 0 ? supabase.from('comment_reactions').select('*').in('comment_id', commentIds) : { data: [] },
      ]);

      const commentsWithProfiles: Comment[] = commentsRes.data?.map(comment => ({
        ...comment,
        profiles: commentProfilesRes.data?.find(p => p.id === comment.user_id) || { full_name: 'Unknown User', profile_image: null },
        reactions: (commentReactionsRes.data as CommentReaction[] || []).filter(r => r.comment_id === comment.id),
      })) || [];

      // Build threaded comments
      const buildThreadedComments = (comments: Comment[], postId: string): Comment[] => {
        const postComments = comments.filter(c => (c as any).post_id === postId);
        const topLevel = postComments.filter(c => !c.parent_comment_id);
        const replies = postComments.filter(c => c.parent_comment_id);
        
        return topLevel.map(comment => ({
          ...comment,
          replies: replies.filter(r => r.parent_comment_id === comment.id),
        }));
      };

      const postsWithData = postsData?.map(post => ({
        ...post,
        reactions: reactionsRes.data?.filter(r => r.post_id === post.id) || [],
        comments: buildThreadedComments(commentsWithProfiles, post.id),
      })) || [];

      setPosts(postsWithData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({ title: "ত্রুটি", description: "পোস্ট লোড করতে সমস্যা হয়েছে", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "ত্রুটি", description: "ছবির সাইজ সর্বোচ্চ ১০ এমবি হতে পারে", variant: "destructive" });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      if (!file.type.startsWith('image/')) {
        toast({ title: "ত্রুটি", description: "শুধুমাত্র ছবি আপলোড করা যাবে", variant: "destructive" });
        return null;
      }
      let compressedFile: File;
      try { compressedFile = await compressPostImage(file); } catch { toast({ title: "ত্রুটি", description: "ছবি প্রসেস করতে সমস্যা হয়েছে", variant: "destructive" }); return null; }
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(2);
      const fileName = `${user?.id}/${uniqueId}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('post-images').upload(fileName, compressedFile, { upsert: true, contentType: `image/${fileExt}` });
      if (uploadError) { toast({ title: "ত্রুটি", description: "ছবি আপলোড করতে সমস্যা হয়েছে", variant: "destructive" }); return null; }
      const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
      return data?.publicUrl || null;
    } catch { toast({ title: "ত্রুটি", description: "ছবি আপলোড করতে সমস্যা হয়েছে", variant: "destructive" }); return null; }
  };

  const handleSubmit = async () => {
    if (!newPost.trim() && !selectedImage) { toast({ title: "ত্রুটি", description: "কিছু লিখুন বা ছবি যোগ করুন", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (selectedImage) { imageUrl = await uploadImage(selectedImage); if (!imageUrl) { setIsSubmitting(false); return; } }
      const { error } = await supabase.from('posts').insert({ content: newPost.trim() || null, image_url: imageUrl, user_id: profile?.id });
      if (error) throw error;
      setNewPost(''); setSelectedImage(null); setImagePreview(null);
      await fetchPosts();
      toast({ title: "সফল", description: "পোস্ট শেয়ার করা হয়েছে" });
    } catch { toast({ title: "ত্রুটি", description: "পোস্ট করতে সমস্যা হয়েছে", variant: "destructive" }); }
    finally { setIsSubmitting(false); }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    if (!profile) return;
    const originalPosts = [...posts];
    const postIndex = originalPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const post = originalPosts[postIndex];
    const existingReactionIndex = post.reactions.findIndex(r => r.user_id === profile.id);
    const newReactions = [...post.reactions];

    if (existingReactionIndex !== -1) {
      const existing = newReactions[existingReactionIndex];
      if (existing.reaction_type === reactionType) { newReactions.splice(existingReactionIndex, 1); }
      else { newReactions[existingReactionIndex] = { ...existing, reaction_type: reactionType }; }
    } else {
      newReactions.push({ id: `temp-${Date.now()}`, user_id: profile.id, reaction_type: reactionType });
    }

    const updatedPosts = [...originalPosts];
    updatedPosts[postIndex] = { ...post, reactions: newReactions };
    setPosts(updatedPosts);

    try {
      const existingReaction = post.reactions.find(r => r.user_id === profile.id);
      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) { await supabase.from('reactions').delete().match({ id: existingReaction.id }); }
        else { await supabase.from('reactions').update({ reaction_type: reactionType }).match({ id: existingReaction.id }); }
      } else { await supabase.from('reactions').insert({ post_id: postId, user_id: profile.id, reaction_type: reactionType }); }
    } catch { toast({ title: "ত্রুটি", description: "প্রতিক্রিয়া জানাতে সমস্যা হয়েছে", variant: "destructive" }); setPosts(originalPosts); }
  };

  const handleCommentReaction = async (commentId: string, reactionType: string) => {
    if (!profile) return;
    try {
      const { data: existing } = await supabase
        .from('comment_reactions')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existing) {
        if (existing.reaction_type === reactionType) {
          await supabase.from('comment_reactions').delete().eq('id', existing.id);
        } else {
          await supabase.from('comment_reactions').update({ reaction_type: reactionType }).eq('id', existing.id);
        }
      } else {
        await supabase.from('comment_reactions').insert({ comment_id: commentId, user_id: profile.id, reaction_type: reactionType });
      }
      await fetchPosts();
    } catch { toast({ title: "ত্রুটি", description: "প্রতিক্রিয়া জানাতে সমস্যা হয়েছে", variant: "destructive" }); }
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!newComment.trim() || !profile) return;
    const commentContent = newComment.trim();
    setNewComment('');

    try {
      const insertData: any = { post_id: postId, user_id: profile.id, content: commentContent };
      if (replyingTo) {
        insertData.parent_comment_id = replyingTo.commentId;
        insertData.reply_to_user_name = replyingTo.userName;
      }
      const { error } = await supabase.from('comments').insert(insertData);
      if (error) throw error;
      setReplyingTo(null);
      setCommentingPostId(null);
      await fetchPosts();
    } catch { toast({ title: "ত্রুটি", description: "মন্তব্য করতে সমস্যা হয়েছে", variant: "destructive" }); setNewComment(commentContent); }
  };

  const handleReply = (comment: Comment, postId: string) => {
    setReplyingTo({ commentId: comment.id, userName: comment.profiles.full_name, postId });
    setCommentingPostId(postId);
    setNewComment('');
  };

  const handleShare = (postId: string) => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => toast({ title: "সফল", description: "পোস্টের লিংক কপি করা হয়েছে" }))
      .catch(() => toast({ title: "ত্রুটি", description: "লিংক কপি করতে সমস্যা হয়েছে", variant: "destructive" }));
  };

  const removeImage = () => { setSelectedImage(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const formatPostDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      if (diffInMinutes < 1) return 'এইমাত্র';
      if (diffInMinutes < 60) return `${diffInMinutes} মিনিট আগে`;
      if (diffInHours < 24) return `${diffInHours} ঘন্টা আগে`;
      if (diffInDays < 7) return `${diffInDays} দিন আগে`;
      return date.toLocaleDateString('bn-BD');
    } catch { return 'সময় অজানা'; }
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { toast({ title: "ত্রুটি", description: "ছবির সাইজ সর্বোচ্চ ১০ এমবি হতে পারে", variant: "destructive" }); return; }
      setEditingImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setEditingImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditPost = (post: Post) => { setEditingPostId(post.id); setEditingContent(post.content || ''); if (post.image_url) setEditingImagePreview(post.image_url); };
  const cancelEdit = () => { setEditingPostId(null); setEditingContent(''); setEditingImage(null); setEditingImagePreview(null); if (editFileInputRef.current) editFileInputRef.current.value = ''; };
  const removeEditImage = () => { setEditingImage(null); setEditingImagePreview(null); if (editFileInputRef.current) editFileInputRef.current.value = ''; };

  const submitEdit = async () => {
    if (!editingPostId || (!editingContent.trim() && !editingImagePreview)) { toast({ title: "ত্রুটি", description: "কিছু লিখুন বা ছবি যোগ করুন", variant: "destructive" }); return; }
    setIsEditingSubmitting(true);
    let newImageUrl = editingImagePreview;
    try {
      if (editingImage) { newImageUrl = await uploadImage(editingImage); if (!newImageUrl) { setIsEditingSubmitting(false); return; } }
      const { error } = await supabase.from('posts').update({ content: editingContent.trim() || null, image_url: newImageUrl, updated_at: new Date().toISOString() }).eq('id', editingPostId);
      if (error) throw error;
      cancelEdit();
      toast({ title: "সফল", description: "পোস্ট আপডেট করা হয়েছে" });
    } catch { toast({ title: "ত্রুটি", description: "পোস্ট আপডেট করতে সমস্যা হয়েছে", variant: "destructive" }); }
    finally { setIsEditingSubmitting(false); }
  };

  const handleDeletePost = async (postId: string, imageUrl: string | null) => {
    const originalPosts = [...posts];
    setPosts(posts.filter(p => p.id !== postId));
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      if (imageUrl) { try { const url = new URL(imageUrl); const path = url.pathname.split('/post-images/').pop(); if (path) await supabase.storage.from('post-images').remove([path]); } catch {} }
      toast({ title: "সফল", description: "পোস্ট ডিলেট করা হয়েছে" });
    } catch { toast({ title: "ত্রুটি", description: "পোস্ট ডিলেট করতে সমস্যা হয়েছে", variant: "destructive" }); setPosts(originalPosts); }
  };

  // Get unique reaction types with counts for display
  const getReactionSummary = (reactions: Reaction[] | CommentReaction[]) => {
    const counts: Record<string, number> = {};
    reactions.forEach(r => { counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const getTotalComments = (comments: Comment[]) => {
    let total = comments.length;
    comments.forEach(c => { total += (c.replies?.length || 0); });
    return total;
  };

  // Render a single comment with reactions and reply
  const renderComment = (comment: Comment, postId: string, isReply = false) => {
    const userCommentReaction = comment.reactions?.find(r => r.user_id === profile?.id);
    const reactionSummary = getReactionSummary(comment.reactions || []);

    return (
      <div key={comment.id} className={`flex items-start space-x-2 ${isReply ? 'ml-10 mt-2' : ''}`}>
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarImage src={comment.profiles?.profile_image || ''} />
          <AvatarFallback className="text-xs">{comment.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-muted rounded-2xl px-3 py-2 inline-block max-w-full">
            <Link to={`/user/${comment.user_id}`} className="font-semibold text-xs hover:underline text-foreground">
              {comment.profiles?.full_name}
            </Link>
            <p className="text-sm text-foreground mt-0.5">
              {comment.reply_to_user_name && (
                <span className="text-primary font-semibold mr-1">@{comment.reply_to_user_name}</span>
              )}
              {comment.content}
            </p>
          </div>
          {/* Reaction badges on comment */}
          {reactionSummary.length > 0 && (
            <div className="flex items-center mt-0.5 ml-2">
              <div className="flex items-center bg-background shadow-sm border rounded-full px-1.5 py-0.5 space-x-0.5">
                {reactionSummary.slice(0, 3).map(([type]) => (
                  <span key={type} className="text-xs">{getReactionEmoji(type)}</span>
                ))}
                <span className="text-xs text-muted-foreground ml-0.5">{comment.reactions.length}</span>
              </div>
            </div>
          )}
          {/* Action row */}
          <div className="flex items-center space-x-3 ml-2 mt-1">
            <span className="text-xs text-muted-foreground">{formatPostDate(comment.created_at)}</span>
            <Popover>
              <PopoverTrigger asChild>
                <button className={`text-xs font-semibold hover:underline ${userCommentReaction ? '' : 'text-muted-foreground'}`}
                  style={userCommentReaction ? { color: getReactionColor(userCommentReaction.reaction_type) } : {}}>
                  {userCommentReaction ? getReactionLabel(userCommentReaction.reaction_type) : 'লাইক'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1" side="top">
                <div className="flex space-x-0.5">
                  {REACTIONS.map(r => (
                    <button key={r.type} onClick={() => handleCommentReaction(comment.id, r.type)}
                      className={`text-2xl hover:scale-125 transition-transform p-1 rounded-full hover:bg-muted ${userCommentReaction?.reaction_type === r.type ? 'bg-muted scale-110' : ''}`}
                      title={r.label}>
                      {r.emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {!isReply && (
              <button className="text-xs font-semibold text-muted-foreground hover:underline" onClick={() => handleReply(comment, postId)}>
                রিপ্লাই
              </button>
            )}
          </div>
          {/* Replies */}
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <div className="mt-1 space-y-1">
              {comment.replies.map(reply => renderComment(reply, postId, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={profile?.profile_image || ''} />
              <AvatarFallback className="bg-green-100 text-green-700">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-foreground">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground">একটি স্ট্যাটাস শেয়ার করুন</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea placeholder="আপনার মনের কথা শেয়ার করুন..." value={newPost} onChange={(e) => setNewPost(e.target.value)} className="min-h-[100px] resize-none border-0 p-0 text-base focus-visible:ring-0" maxLength={500} />
          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg border" />
              <Button size="sm" variant="destructive" className="absolute top-2 right-2 h-8 w-8 p-0" onClick={removeImage}><X className="h-4 w-4" /></Button>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="text-green-600 hover:text-green-700 hover:bg-green-50"><Camera className="h-4 w-4 mr-2" />ছবি</Button>
              <span className="text-xs text-muted-foreground">{newPost.length}/500</span>
            </div>
            <Button onClick={handleSubmit} disabled={isSubmitting || (!newPost.trim() && !selectedImage)} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}পোস্ট করুন
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
      ) : (
        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card><CardContent className="text-center py-8"><p className="text-muted-foreground">এখনো কোন পোস্ট নেই</p><p className="text-sm text-muted-foreground mt-1">প্রথম পোস্ট করুন!</p></CardContent></Card>
          ) : (
            posts.map((post) => {
              const userReaction = post.reactions.find(r => r.user_id === profile?.id);
              const reactionSummary = getReactionSummary(post.reactions);
              const totalComments = getTotalComments(post.comments);

              return (
                <Card key={post.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={post.profiles?.profile_image || ''} />
                        <AvatarFallback className="bg-blue-100 text-blue-700">{post.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Link to={`/user/${post.user_id}`} className="font-medium text-foreground hover:underline">{post.profiles?.full_name || 'Unknown User'}</Link>
                        <p className="text-sm text-muted-foreground">{formatPostDate(post.created_at)}</p>
                      </div>
                      {post.user_id === profile?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleEditPost(post); }}>
                                  <Edit className="h-4 w-4 mr-2" />এডিট করুন
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader><DialogTitle>পোস্ট এডিট করুন</DialogTitle></DialogHeader>
                                <div className="space-y-4">
                                  <Textarea placeholder="আপনার মনের কথা লিখুন..." value={editingContent} onChange={(e) => setEditingContent(e.target.value)} className="min-h-[100px] resize-none" maxLength={500} />
                                  {editingImagePreview && (
                                    <div className="relative">
                                      <img src={editingImagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg border" />
                                      <Button size="sm" variant="destructive" className="absolute top-2 right-2 h-8 w-8 p-0" onClick={removeEditImage}><X className="h-4 w-4" /></Button>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Input type="file" ref={editFileInputRef} onChange={handleEditImageSelect} accept="image/*" className="hidden" />
                                      <Button variant="ghost" size="sm" onClick={() => editFileInputRef.current?.click()} className="text-green-600 hover:text-green-700"><Camera className="h-4 w-4 mr-2" />ছবি</Button>
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button variant="outline" onClick={cancelEdit}>বাতিল</Button>
                                      <Button onClick={submitEdit} disabled={isEditingSubmitting || (!editingContent.trim() && !editingImagePreview)}>
                                        {isEditingSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}আপডেট করুন
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />ডিলেট করুন</DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>পোস্ট ডিলেট করবেন?</AlertDialogTitle>
                                  <AlertDialogDescription>এই পোস্টটি স্থায়ীভাবে ডিলেট হয়ে যাবে।</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePost(post.id, post.image_url)} className="bg-red-600 hover:bg-red-700">ডিলেট করুন</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {post.content && (
                      <div>
                        <p className="text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
                        {post.edited_by_admin && <p className="text-xs text-muted-foreground mt-2">Edited By Admin</p>}
                      </div>
                    )}
                    {post.image_url && (
                      <>
                        <div className="rounded-lg overflow-hidden border cursor-pointer" onClick={() => setFullscreenImage(post.image_url)}>
                          <img src={post.image_url} alt="Post image" className="w-full max-h-96 object-cover hover:opacity-90 transition-opacity" />
                        </div>
                        <FullscreenImageViewer src={fullscreenImage || ''} isOpen={fullscreenImage === post.image_url} onClose={() => setFullscreenImage(null)} />
                      </>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col items-start">
                    {/* Reaction summary bar */}
                    <div className="flex items-center justify-between w-full py-1.5">
                      <div className="flex items-center space-x-1">
                        {reactionSummary.slice(0, 3).map(([type]) => (
                          <span key={type} className="text-base drop-shadow-sm">{getReactionEmoji(type)}</span>
                        ))}
                        {post.reactions.length > 0 && <span className="text-sm text-muted-foreground ml-1">{post.reactions.length}</span>}
                      </div>
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        {totalComments > 0 && <span>{totalComments} মন্তব্য</span>}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="w-full border-t border-b py-1 flex items-center justify-around">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="flex-1 gap-2"
                            style={userReaction ? { color: getReactionColor(userReaction.reaction_type) } : {}}>
                            {userReaction ? (
                              <span className="text-lg">{getReactionEmoji(userReaction.reaction_type)}</span>
                            ) : (
                              <span className="text-lg">👍</span>
                            )}
                            <span className="text-sm font-medium">
                              {userReaction ? getReactionLabel(userReaction.reaction_type) : 'লাইক'}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 rounded-full" side="top">
                          <div className="flex space-x-1">
                            {REACTIONS.map(r => (
                              <button key={r.type} onClick={() => handleReaction(post.id, r.type)}
                                className={`text-3xl hover:scale-150 transition-all duration-200 p-1 rounded-full hover:bg-muted ${userReaction?.reaction_type === r.type ? 'scale-125 bg-muted' : ''}`}
                                title={r.label}>
                                {r.emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-primary gap-2" onClick={() => { setCommentingPostId(post.id); setReplyingTo(null); }}>
                        <MessageCircle className="h-5 w-5" /><span className="text-sm font-medium">মন্তব্য</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-green-500 gap-2" onClick={() => handleShare(post.id)}>
                        <Share2 className="h-5 w-5" /><span className="text-sm font-medium">শেয়ার</span>
                      </Button>
                    </div>

                    {/* Comments section */}
                    {post.comments.length > 0 && (
                      <div className="w-full pt-3 space-y-2">
                        {post.comments.map(comment => renderComment(comment, post.id))}
                      </div>
                    )}

                    {/* Comment input */}
                    {commentingPostId === post.id && (
                      <div className="w-full pt-3">
                        {replyingTo && replyingTo.postId === post.id && (
                          <div className="flex items-center mb-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-1.5">
                            <span>রিপ্লাই দিচ্ছেন <span className="font-semibold text-primary">@{replyingTo.userName}</span></span>
                            <button onClick={() => setReplyingTo(null)} className="ml-auto text-muted-foreground hover:text-foreground">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-start space-x-2">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={profile?.profile_image || ''} />
                            <AvatarFallback className="text-xs">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex items-center bg-muted rounded-full px-3 py-1">
                            <input
                              type="text"
                              placeholder={replyingTo ? `@${replyingTo.userName} কে রিপ্লাই...` : "মন্তব্য লিখুন..."}
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(post.id); } }}
                              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                            />
                            <button onClick={() => handleCommentSubmit(post.id)} disabled={!newComment.trim()} className="text-primary disabled:text-muted-foreground ml-2">
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SocialFeed;
