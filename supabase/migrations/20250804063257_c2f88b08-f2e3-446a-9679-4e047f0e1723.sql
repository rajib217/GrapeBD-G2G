-- Create reactions table for post reactions
CREATE TABLE public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create comments table for post comments
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reactions table
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for reactions
CREATE POLICY "Everyone can view reactions" 
ON public.reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own reactions" 
ON public.reactions 
FOR INSERT 
WITH CHECK (user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can update their own reactions" 
ON public.reactions 
FOR UPDATE 
USING (user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can delete their own reactions" 
ON public.reactions 
FOR DELETE 
USING (user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Enable RLS on comments table
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
CREATE POLICY "Everyone can view comments" 
ON public.comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Add trigger for updating comments updated_at
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();