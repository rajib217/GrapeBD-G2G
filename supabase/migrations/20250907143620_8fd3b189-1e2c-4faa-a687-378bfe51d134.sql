-- Add trigger for messages table to send notifications
DROP TRIGGER IF EXISTS trigger_notify_message_received ON messages;
CREATE TRIGGER trigger_notify_message_received
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_received();

-- Create function to notify gift received
CREATE OR REPLACE FUNCTION public.notify_gift_received()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Only notify when gift status changes to 'received'
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN
    -- Call the edge function to send FCM notification asynchronously  
    PERFORM net.http_post(
      'https://hpmcbosuvmujhljdccui.supabase.co/functions/v1/send-notification',
      jsonb_build_object(
        'user_id', NEW.receiver_id,
        'title', 'গিফট পেয়েছেন!',
        'body', 'আপনি একটি নতুন গিফট পেয়েছেন।',
        'data', jsonb_build_object(
          'type', 'gift_received',
          'gift_id', NEW.id
        )
      )::text,
      'application/json'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the update
    RAISE WARNING 'Failed to send gift notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Add trigger for gifts table
DROP TRIGGER IF EXISTS trigger_notify_gift_received ON gifts;
CREATE TRIGGER trigger_notify_gift_received
  AFTER UPDATE ON gifts
  FOR EACH ROW
  EXECUTE FUNCTION notify_gift_received();