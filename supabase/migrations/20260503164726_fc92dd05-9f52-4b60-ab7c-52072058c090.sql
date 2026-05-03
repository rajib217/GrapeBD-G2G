
CREATE OR REPLACE FUNCTION public.add_round_to_profile_participation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  round_title text;
BEGIN
  SELECT title INTO round_title FROM public.gift_rounds WHERE id = NEW.gift_round_id;
  IF round_title IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles
  SET g2g_rounds_participated =
    CASE
      WHEN g2g_rounds_participated IS NULL THEN ARRAY[round_title]
      WHEN NOT (round_title = ANY(g2g_rounds_participated)) THEN array_append(g2g_rounds_participated, round_title)
      ELSE g2g_rounds_participated
    END,
    updated_at = now()
  WHERE id IN (NEW.sender_id, NEW.receiver_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_add_round_to_profile_participation ON public.gifts;
CREATE TRIGGER trg_add_round_to_profile_participation
AFTER INSERT ON public.gifts
FOR EACH ROW
EXECUTE FUNCTION public.add_round_to_profile_participation();

-- Backfill existing gifts
UPDATE public.profiles p
SET g2g_rounds_participated = sub.rounds,
    updated_at = now()
FROM (
  SELECT pid AS profile_id, array_agg(DISTINCT title) AS rounds
  FROM (
    SELECT g.sender_id AS pid, gr.title FROM public.gifts g JOIN public.gift_rounds gr ON gr.id = g.gift_round_id
    UNION
    SELECT g.receiver_id AS pid, gr.title FROM public.gifts g JOIN public.gift_rounds gr ON gr.id = g.gift_round_id
  ) x
  GROUP BY pid
) sub
WHERE p.id = sub.profile_id;
