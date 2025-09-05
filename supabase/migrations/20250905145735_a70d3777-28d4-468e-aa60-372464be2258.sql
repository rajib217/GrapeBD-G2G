-- Drop existing trigger and function
DROP TRIGGER IF EXISTS message_notification_trigger ON public.messages;
DROP FUNCTION IF EXISTS notify_message_received();

-- Create improved database trigger for automatic message notifications
CREATE OR REPLACE FUNCTION notify_message_received()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger on messages table
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_received();