-- Create or replace the function that will handle all user deletion
CREATE OR REPLACE FUNCTION delete_user_cascade(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_id UUID;
  user_role TEXT;
BEGIN
  -- Get the ID of the requesting user
  requesting_user_id := auth.uid();
  
  -- Check if the requesting user exists and is an admin
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = requesting_user_id;
  
  IF user_role IS NULL OR user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Delete all user related data in correct order
  DELETE FROM public.user_notice_reads WHERE user_id = target_user_id;
  DELETE FROM public.messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  DELETE FROM public.reactions WHERE user_id = target_user_id;
  DELETE FROM public.comments WHERE user_id = target_user_id;
  DELETE FROM public.posts WHERE user_id = target_user_id;
  DELETE FROM public.gifts WHERE sender_id = target_user_id OR recipient_id = target_user_id;
  DELETE FROM public.gift_histories WHERE sender_id = target_user_id OR recipient_id = target_user_id;
  DELETE FROM public.user_stocks WHERE user_id = target_user_id;
  DELETE FROM public.user_varieties WHERE user_id = target_user_id;
  DELETE FROM public.notices WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Delete the auth.users record using direct database access (requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_cascade TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_user_cascade IS 'Deletes a user and all related data. Can only be executed by admin users.';