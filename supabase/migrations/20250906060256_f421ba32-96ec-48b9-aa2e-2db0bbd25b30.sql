-- Fix admin_delete_user function to properly delete from auth.users table
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
  
  -- Delete from auth.users which will cascade to profiles and other related data
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- Also clean up any remaining profile data if it exists
  DELETE FROM public.profiles WHERE user_id = target_user_id;
END;
$$;