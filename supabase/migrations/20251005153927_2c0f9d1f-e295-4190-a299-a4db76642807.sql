-- Enable pg_net for HTTP requests from Postgres
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Ensure the trigger exists to send notifications on new messages
DROP TRIGGER IF EXISTS trg_notify_message_received ON public.messages;
CREATE TRIGGER trg_notify_message_received
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_message_received();