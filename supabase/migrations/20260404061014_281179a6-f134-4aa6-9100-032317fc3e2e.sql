
-- Add parent_comment_id and reply_to_user_name to comments table
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS reply_to_user_name text;

-- Create comment_reactions table
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for comment_reactions
CREATE POLICY "Everyone can view comment reactions"
ON public.comment_reactions FOR SELECT TO public
USING (true);

CREATE POLICY "Users can create their own comment reactions"
ON public.comment_reactions FOR INSERT TO public
WITH CHECK (user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can delete their own comment reactions"
ON public.comment_reactions FOR DELETE TO public
USING (user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can update their own comment reactions"
ON public.comment_reactions FOR UPDATE TO public
USING (user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));
