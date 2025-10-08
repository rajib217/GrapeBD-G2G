-- Remove all DB trigger-based HTTP notifications (use Edge Functions instead)
DROP TRIGGER IF EXISTS message_notification_trigger ON public.messages;
DROP TRIGGER IF EXISTS notify_new_message ON public.messages;
DROP TRIGGER IF EXISTS trigger_notify_message_received ON public.messages;
DROP TRIGGER IF EXISTS trg_notify_message_received ON public.messages;

DROP FUNCTION IF EXISTS public.notify_message_received() CASCADE;
