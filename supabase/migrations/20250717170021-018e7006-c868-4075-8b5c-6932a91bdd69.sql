-- Fix RLS policies for gifts table to allow users to update gift status
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view gifts they are involved in" ON gifts;
DROP POLICY IF EXISTS "Users can create gifts" ON gifts;

-- Create improved policies for gifts table
CREATE POLICY "Users can view gifts they are involved in"
ON gifts
FOR SELECT
USING (
  sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) 
  OR receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR get_current_user_role() = 'admin'::app_role
);

CREATE POLICY "Users can create gifts"
ON gifts
FOR INSERT
WITH CHECK (
  sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Add policy to allow users to update gifts they receive (for marking as received)
CREATE POLICY "Users can update gifts they receive"
ON gifts
FOR UPDATE
USING (
  receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR get_current_user_role() = 'admin'::app_role
)
WITH CHECK (
  receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR get_current_user_role() = 'admin'::app_role
);