-- Update the gifts table RLS policy to allow senders to update gifts they are assigned to send
DROP POLICY IF EXISTS "Users can update gifts they receive" ON gifts;

-- Create comprehensive update policy for both receivers and senders
CREATE POLICY "Users can update gifts they are involved in"
ON gifts
FOR UPDATE
USING (
  receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR get_current_user_role() = 'admin'::app_role
)
WITH CHECK (
  receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR get_current_user_role() = 'admin'::app_role
);