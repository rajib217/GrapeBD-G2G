-- Fix the function search path security warning
CREATE OR REPLACE FUNCTION notify_message_received()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Call the edge function to send FCM notification asynchronously
  PERFORM net.http_post(
    'https://hpmcbosuvmujhljdccui.supabase.co/functions/v1/send-message-notification',
    jsonb_build_object('record', to_jsonb(NEW)),
    'application/json'::jsonb,
    jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    )
  );
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
    RETURN NEW;
END;
$$;