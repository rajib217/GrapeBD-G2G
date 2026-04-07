
CREATE TABLE public.gift_request_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.gift_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_request_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view request notes"
  ON public.gift_request_notes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can add notes"
  ON public.gift_request_notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can delete their own notes"
  ON public.gift_request_notes FOR DELETE
  TO authenticated
  USING (user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Admins can manage all notes"
  ON public.gift_request_notes FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin'::app_role);
