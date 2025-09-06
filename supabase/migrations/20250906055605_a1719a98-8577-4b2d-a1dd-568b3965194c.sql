-- Fix the notify_message_received function to properly format JSON for edge function
CREATE OR REPLACE FUNCTION public.notify_message_received()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Call the edge function to send FCM notification asynchronously  
  PERFORM net.http_post(
    'https://hpmcbosuvmujhljdccui.supabase.co/functions/v1/send-message-notification',
    jsonb_build_object(
      'record', jsonb_build_object(
        'receiver_id', NEW.receiver_id,
        'sender_id', NEW.sender_id,
        'content', NEW.content
      )
    )::text,
    'application/json'
  );
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
    RETURN NEW;
END;
$$;