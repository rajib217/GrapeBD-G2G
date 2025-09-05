-- Fix all functions to have proper search_path settings
-- This will resolve the remaining function search path warnings

-- Fix get_current_user_role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Fix notify_message_received  
CREATE OR REPLACE FUNCTION public.notify_message_received()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Call the edge function to send FCM notification asynchronously
  PERFORM net.http_post(
    'https://hpmcbosuvmujhljdccui.supabase.co/functions/v1/send-message-notification',
    jsonb_build_object('record', to_jsonb(NEW)),
    'application/json'::jsonb,
    jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    )
  );
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if profile already exists for this user_id
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    -- Update existing profile with new data
    UPDATE public.profiles 
    SET 
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name, 'New User'),
      email = COALESCE(NEW.email, email),
      updated_at = now()
    WHERE user_id = NEW.id;
  ELSE
    -- Insert new profile
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
      NEW.email,
      'member'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Fix admin_delete_user
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role app_role;
BEGIN
  -- Check if current user is admin
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;
  
  -- Delete from auth.users which will cascade to profiles due to foreign key
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Fix get_user_received_gift_varieties
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

-- Fix update_updated_at_column
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