-- Allow users to delete messages they are involved in (sender or receiver)
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (
  sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);