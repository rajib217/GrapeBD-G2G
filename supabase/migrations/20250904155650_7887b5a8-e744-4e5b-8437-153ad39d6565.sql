-- Create database trigger for automatic message notifications
CREATE OR REPLACE FUNCTION notify_message_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function to send FCM notification
  PERFORM net.http_post(
    'https://hpmcbosuvmujhljdccui.supabase.co/functions/v1/send-message-notification',
    jsonb_build_object('record', row_to_json(NEW)),
    'application/json',
    jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.jwt_token', true)
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on messages table
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_received();