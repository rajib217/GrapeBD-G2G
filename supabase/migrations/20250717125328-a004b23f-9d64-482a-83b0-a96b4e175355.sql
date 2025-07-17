
-- Update RLS policies for messages table to allow all users to send messages to each other
-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON messages;

-- Allow all authenticated users to send messages to any other user
CREATE POLICY "All users can send messages" 
  ON messages 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Allow users to view messages they sent or received
CREATE POLICY "Users can view their messages" 
  ON messages 
  FOR SELECT 
  TO authenticated
  USING (
    sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR 
    receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR 
    get_current_user_role() = 'admin'::app_role
  );

-- Allow users to update messages they received (for marking as read)
CREATE POLICY "Users can update received messages" 
  ON messages 
  FOR UPDATE 
  TO authenticated
  USING (
    receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Allow admins to manage all messages
CREATE POLICY "Admins can manage all messages" 
  ON messages 
  FOR ALL 
  TO authenticated
  USING (get_current_user_role() = 'admin'::app_role);
