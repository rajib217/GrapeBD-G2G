-- Add details_url column to varieties table for storing detailed information URL
ALTER TABLE public.varieties 
ADD COLUMN details_url text;