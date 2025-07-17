-- Create table to track user notice reads
CREATE TABLE public.user_notice_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notice_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, notice_id)
);

-- Enable RLS
ALTER TABLE public.user_notice_reads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notice reads" 
ON public.user_notice_reads 
FOR SELECT 
USING (user_id = ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can create their own notice reads" 
ON public.user_notice_reads 
FOR INSERT 
WITH CHECK (user_id = ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Admins can manage all notice reads
CREATE POLICY "Admins can manage all notice reads" 
ON public.user_notice_reads 
FOR ALL 
USING (get_current_user_role() = 'admin'::app_role);

-- Add foreign key references
ALTER TABLE public.user_notice_reads 
ADD CONSTRAINT user_notice_reads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_notice_reads 
ADD CONSTRAINT user_notice_reads_notice_id_fkey 
FOREIGN KEY (notice_id) REFERENCES public.notices(id) ON DELETE CASCADE;