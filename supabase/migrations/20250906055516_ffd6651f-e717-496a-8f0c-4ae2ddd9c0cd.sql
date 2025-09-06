-- Add trigger to messages table to send notifications when new message is inserted
CREATE TRIGGER notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_message_received();