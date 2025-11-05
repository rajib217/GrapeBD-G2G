-- Add edited_by_admin field to posts table
ALTER TABLE public.posts 
ADD COLUMN edited_by_admin boolean DEFAULT false;

-- Add edited_by_admin field to comments table
ALTER TABLE public.comments 
ADD COLUMN edited_by_admin boolean DEFAULT false;

-- Update RLS policy for comments to allow admins to manage all comments
CREATE POLICY "Admins can manage all comments"
ON public.comments
FOR ALL
TO authenticated
USING (get_current_user_role() = 'admin'::app_role);