
CREATE TABLE public.gift_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  variety_id uuid REFERENCES public.varieties(id) ON DELETE SET NULL,
  variety_name text,
  quantity integer NOT NULL DEFAULT 1,
  note text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'closed')),
  fulfilled_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view open requests" ON public.gift_requests FOR SELECT USING (true);
CREATE POLICY "Users can create their own requests" ON public.gift_requests FOR INSERT TO authenticated WITH CHECK (requester_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own requests" ON public.gift_requests FOR UPDATE TO authenticated USING (requester_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all requests" ON public.gift_requests FOR ALL TO authenticated USING (get_current_user_role() = 'admin');
CREATE POLICY "Users can delete their own requests" ON public.gift_requests FOR DELETE TO authenticated USING (requester_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));
