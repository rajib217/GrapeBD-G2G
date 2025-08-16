-- Drop old policies
DROP POLICY IF EXISTS "Users can view active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete user data" ON public.profiles;

-- Create new policies for profiles
CREATE POLICY "View profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR 
  status = 'active' OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin full access" ON public.profiles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policies for messages
DROP POLICY IF EXISTS "Users can manage their messages" ON public.messages;
CREATE POLICY "Users can manage their messages" ON public.messages
FOR ALL TO authenticated
USING (
  sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  receiver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Policies for posts
DROP POLICY IF EXISTS "Users can manage their posts" ON public.posts;
CREATE POLICY "Users can manage their posts" ON public.posts
FOR ALL TO authenticated
USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Policies for comments
DROP POLICY IF EXISTS "Users can manage their comments" ON public.comments;
CREATE POLICY "Users can manage their comments" ON public.comments
FOR ALL TO authenticated
USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Policies for reactions
DROP POLICY IF EXISTS "Users can manage their reactions" ON public.reactions;
CREATE POLICY "Users can manage their reactions" ON public.reactions
FOR ALL TO authenticated
USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Policies for user_stocks
DROP POLICY IF EXISTS "Users can manage their stocks" ON public.user_stocks;
CREATE POLICY "Users can manage their stocks" ON public.user_stocks
FOR ALL TO authenticated
USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Policies for gifts
DROP POLICY IF EXISTS "Users can manage their gifts" ON public.gifts;
CREATE POLICY "Users can manage their gifts" ON public.gifts
FOR ALL TO authenticated
USING (
  sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);