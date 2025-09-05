-- Enable RLS on user_push_subscriptions table
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
ON public.user_push_subscriptions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix search_path for existing functions (this addresses the function search path warnings)
-- Update get_user_received_gift_varieties function
CREATE OR REPLACE FUNCTION public.get_user_received_gift_varieties(profile_id uuid)
 RETURNS TABLE(variety_id uuid, variety_name text, variety_thumbnail text, gift_count bigint, latest_gift_date timestamp with time zone)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = public
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

-- Update get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;