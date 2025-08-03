import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageCompression';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Camera, Heart, MessageCircle, Share2, Send, X, Loader2, ThumbsUp, Angry, Laugh, Frown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Reaction {
  id: string;
  user_id: string;
  reaction_type: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    profile_image: string | null;
  };
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    profile_image: string | null;
  };
  reactions: Reaction[];
  comments: Comment[];
}

const SocialFeed = () => {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchPosts();
    
    const channel = supabase
      .channel('social-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles ( full_name, profile_image ),
          reactions ( id, user_id, reaction_type ),
          comments ( id, content, created_at, user_id, profiles ( full_name, profile_image ) )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
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
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
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
      const compressedFile = await compressImage(file, 100);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${profile?.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('post-images').upload(fileName, compressedFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(fileName);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "ত্রুটি", description: "ছবি আপলোড করতে সমস্যা হয়েছে", variant: "destructive" });
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!newPost.trim() && !selectedImage) {
      toast({ title: "ত্রুটি", description: "কিছু লিখুন বা ছবি যোগ করুন", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          setIsSubmitting(false);
          return;
        }
      }
      const { error } = await supabase.from('posts').insert({ content: newPost.trim() || null, image_url: imageUrl, user_id: profile?.id });
      if (error) throw error;
      setNewPost('');
      setSelectedImage(null);
      setImagePreview(null);
      toast({ title: "সফল", description: "পোস্ট শেয়ার করা হয়েছে" });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: "ত্রুটি", description: "পোস্ট করতে সমস্যা হয়েছে", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    if (!profile) return;
    const existingReaction = posts.find(p => p.id === postId)?.reactions.find(r => r.user_id === profile.id);
    
    try {
      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Un-react
          await supabase.from('reactions').delete().match({ id: existingReaction.id });
        } else {
          // Change reaction
          await supabase.from('reactions').update({ reaction_type: reactionType }).match({ id: existingReaction.id });
        }
      } else {
        // Add new reaction
        await supabase.from('reactions').insert({ post_id: postId, user_id: profile.id, reaction_type: reactionType });
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast({ title: "ত্রুটি", description: "প্রতিক্রিয়া জানাতে সমস্যা হয়েছে", variant: "destructive" });
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!newComment.trim() || !profile) return;
    try {
      await supabase.from('comments').insert({ post_id: postId, user_id: profile.id, content: newComment.trim() });
      setNewComment('');
      setCommentingPostId(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({ title: "ত্রুটি", description: "মন্তব্য করতে সমস্যা হয়েছে", variant: "destructive" });
    }
  };

  const handleShare = (postId: string) => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => toast({ title: "সফল", description: "পোস্টের লিংক কপি করা হয়েছে" }))
      .catch(() => toast({ title: "ত্রুটি", description: "লিংক কপি করতে সমস্যা হয়েছে", variant: "destructive" }));
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatPostDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: bn });
    } catch {
      return 'সময় অজানা';
    }
  };

  const reactionIcons: { [key: string]: React.ElementType } = {
    like: ThumbsUp,
    love: Heart,
    laugh: Laugh,
    angry: Angry,
    sad: Frown,
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
              <p className="font-medium text-gray-900">{profile?.full_name}</p>
              <p className="text-sm text-gray-500">একটি স্ট্যাটাস শেয়ার করুন</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="আপনার মনের কথা শেয়ার করুন..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[100px] resize-none border-0 p-0 text-base focus-visible:ring-0"
            maxLength={500}
          />
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
              <span className="text-xs text-gray-400">{newPost.length}/500</span>
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
            <Card><CardContent className="text-center py-8"><p className="text-gray-500">এখনো কোন পোস্ট নেই</p><p className="text-sm text-gray-400 mt-1">প্রথম পোস্ট করুন!</p></CardContent></Card>
          ) : (
            posts.map((post) => {
              const userReaction = post.reactions.find(r => r.user_id === profile?.id);
              const ReactionIcon = userReaction ? reactionIcons[userReaction.reaction_type] : ThumbsUp;

              return (
                <Card key={post.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={post.profiles?.profile_image || ''} />
                        <AvatarFallback className="bg-blue-100 text-blue-700">{post.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{post.profiles?.full_name || 'Unknown User'}</p>
                        <p className="text-sm text-gray-500">{formatPostDate(post.created_at)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {post.content && <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{post.content}</p>}
                    {post.image_url && <div className="rounded-lg overflow-hidden border"><img src={post.image_url} alt="Post image" className="w-full max-h-96 object-cover" /></div>}
                  </CardContent>
                  <CardFooter className="flex flex-col items-start">
                    <div className="flex items-center justify-between w-full py-2">
                      <div className="flex items-center space-x-1">
                        {Object.entries(reactionIcons).slice(0, 3).map(([type, Icon]) => {
                          const count = post.reactions.filter(r => r.reaction_type === type).length;
                          if (count > 0) return <Icon key={type} className="h-5 w-5 text-blue-500" />;
                          return null;
                        })}
                        {post.reactions.length > 0 && <span className="text-sm text-gray-500">{post.reactions.length}</span>}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{post.comments.length} মন্তব্য</span>
                        <span>0 শেয়ার</span>
                      </div>
                    </div>
                    <div className="w-full border-t pt-2 flex items-center justify-around">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className={`flex-1 ${userReaction ? 'text-blue-600' : 'text-gray-500'}`}>
                            <ReactionIcon className="h-5 w-5 mr-2" />
                            {userReaction ? userReaction.reaction_type : 'React'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-1">
                          <div className="flex space-x-1">
                            {Object.entries(reactionIcons).map(([type, Icon]) => (
                              <Button key={type} variant="ghost" size="icon" onClick={() => handleReaction(post.id, type)}><Icon className={`h-6 w-6 ${userReaction?.reaction_type === type ? 'text-blue-500' : 'text-gray-500'}`} /></Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button variant="ghost" size="sm" className="flex-1 text-gray-500 hover:text-blue-500" onClick={() => setCommentingPostId(post.id)}>
                        <MessageCircle className="h-5 w-5 mr-2" />মন্তব্য
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 text-gray-500 hover:text-green-500" onClick={() => handleShare(post.id)}>
                        <Share2 className="h-5 w-5 mr-2" />শেয়ার
                      </Button>
                    </div>
                    {commentingPostId === post.id && (
                      <div className="w-full pt-4">
                        <div className="flex items-start space-x-3">
                          <Avatar>
                            <AvatarImage src={profile?.profile_image || ''} />
                            <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea placeholder="আপনার মন্তব্য লিখুন..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="min-h-[60px]" />
                            <div className="flex justify-end mt-2">
                              <Button size="sm" onClick={() => handleCommentSubmit(post.id)} disabled={!newComment.trim()}>পোস্ট করুন</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {post.comments.length > 0 && (
                      <div className="w-full pt-4 space-y-4">
                        {post.comments.map(comment => (
                          <div key={comment.id} className="flex items-start space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.profiles?.profile_image || ''} />
                              <AvatarFallback>{comment.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-gray-100 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">{comment.profiles?.full_name}</p>
                                <p className="text-xs text-gray-500">{formatPostDate(comment.created_at)}</p>
                              </div>
                              <p className="text-sm mt-1">{comment.content}</p>
                            </div>
                          </div>
                        ))}
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