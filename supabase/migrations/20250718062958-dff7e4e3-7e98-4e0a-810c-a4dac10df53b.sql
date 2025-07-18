-- Add new fields to profiles table for enhanced user information
ALTER TABLE public.profiles 
ADD COLUMN preferred_courier TEXT,
ADD COLUMN g2g_rounds_participated TEXT[],
ADD COLUMN bio TEXT;

-- Create a table to track user's own varieties (what they grow)
CREATE TABLE public.user_varieties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  variety_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_varieties_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_varieties_variety_id_fkey FOREIGN KEY (variety_id) REFERENCES public.varieties(id) ON DELETE CASCADE,
  CONSTRAINT user_varieties_unique UNIQUE (user_id, variety_id)
);

-- Enable RLS on user_varieties table
ALTER TABLE public.user_varieties ENABLE ROW LEVEL SECURITY;

-- Create policies for user_varieties table
CREATE POLICY "Users can view all user varieties" 
ON public.user_varieties 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own varieties" 
ON public.user_varieties 
FOR ALL 
USING (user_id = ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Create function to get received gift varieties for a user
CREATE OR REPLACE FUNCTION get_user_received_gift_varieties(profile_id UUID)
RETURNS TABLE (
  variety_id UUID,
  variety_name TEXT,
  variety_thumbnail TEXT,
  gift_count BIGINT,
  latest_gift_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    v.id as variety_id,
    v.name as variety_name,
    v.thumbnail_image as variety_thumbnail,
    COUNT(g.id) as gift_count,
    MAX(g.received_at) as latest_gift_date
  FROM varieties v
  JOIN gifts g ON v.id = g.variety_id
  WHERE g.receiver_id = profile_id 
    AND g.status = 'received'
  GROUP BY v.id, v.name, v.thumbnail_image
  ORDER BY latest_gift_date DESC;
$$;

-- Create trigger for user_varieties updated_at
CREATE TRIGGER update_user_varieties_updated_at
BEFORE UPDATE ON public.user_varieties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();