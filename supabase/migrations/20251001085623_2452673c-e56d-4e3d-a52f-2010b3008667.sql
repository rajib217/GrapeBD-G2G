-- Create triggers to send FCM notifications on new messages and when gifts are received
-- Drop existing triggers to avoid duplicates
DROP TRIGGER IF EXISTS trigger_notify_message_received ON public.messages;
CREATE TRIGGER trigger_notify_message_received
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_message_received();

DROP TRIGGER IF EXISTS trigger_notify_gift_received ON public.gifts;
CREATE TRIGGER trigger_notify_gift_received
AFTER UPDATE ON public.gifts
FOR EACH ROW
EXECUTE FUNCTION public.notify_gift_received();