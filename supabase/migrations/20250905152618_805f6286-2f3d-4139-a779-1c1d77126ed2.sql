-- Fix user deletion and ghost profile issues

-- First, update the handle_new_user function to handle existing profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create function to completely delete a user from auth.users
-- This will cascade delete all related data due to foreign key constraints
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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