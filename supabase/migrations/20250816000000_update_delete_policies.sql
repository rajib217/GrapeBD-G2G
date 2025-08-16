-- Allow admins to delete profiles and related data
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete user data" ON public.user_stocks;
CREATE POLICY "Admins can delete user data" ON public.user_stocks
  FOR DELETE USING (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete user messages" ON public.messages;
CREATE POLICY "Admins can delete user messages" ON public.messages
  FOR DELETE USING (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete user gifts" ON public.gifts;
CREATE POLICY "Admins can delete user gifts" ON public.gifts
  FOR DELETE USING (public.get_current_user_role() = 'admin');

-- Ensure cascade delete is enabled
ALTER TABLE IF EXISTS public.user_stocks
  DROP CONSTRAINT IF EXISTS user_stocks_user_id_fkey,
  ADD CONSTRAINT user_stocks_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.gifts
  DROP CONSTRAINT IF EXISTS gifts_sender_id_fkey,
  ADD CONSTRAINT gifts_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS gifts_receiver_id_fkey,
  ADD CONSTRAINT gifts_receiver_id_fkey
    FOREIGN KEY (receiver_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.messages
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
  ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey,
  ADD CONSTRAINT messages_receiver_id_fkey
    FOREIGN KEY (receiver_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;