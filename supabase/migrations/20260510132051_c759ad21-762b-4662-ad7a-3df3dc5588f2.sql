-- Add 'died' to gift_status enum
ALTER TYPE public.gift_status ADD VALUE IF NOT EXISTS 'died';

-- Add death tracking columns to gifts
ALTER TABLE public.gifts
  ADD COLUMN IF NOT EXISTS died_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS death_reason text,
  ADD COLUMN IF NOT EXISTS death_note text,
  ADD COLUMN IF NOT EXISTS death_image text;

-- Trigger to notify sender when receiver marks gift as died
CREATE OR REPLACE FUNCTION public.notify_gift_died()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_user_id uuid;
  variety_name text;
BEGIN
  IF NEW.status = 'died' AND (OLD.status IS NULL OR OLD.status <> 'died') THEN
    SELECT p.user_id INTO sender_user_id FROM public.profiles p WHERE p.id = NEW.sender_id;
    SELECT v.name INTO variety_name FROM public.varieties v WHERE v.id = NEW.variety_id;

    PERFORM net.http_post(
      'https://hpmcbosuvmujhljdccui.supabase.co/functions/v1/send-notification',
      jsonb_build_object(
        'user_id', sender_user_id,
        'title', 'চারা মারা গেছে',
        'body', COALESCE(variety_name, 'একটি চারা') || ' জাতের প্রাপ্ত চারাটি মারা গেছে বলে জানানো হয়েছে।',
        'data', jsonb_build_object('type','gift_died','gift_id', NEW.id)
      )::text,
      'application/json'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_gift_died failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_gift_died ON public.gifts;
CREATE TRIGGER trg_notify_gift_died
AFTER UPDATE ON public.gifts
FOR EACH ROW
EXECUTE FUNCTION public.notify_gift_died();