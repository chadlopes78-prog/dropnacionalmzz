ALTER TABLE public.orders ADD COLUMN phone_secondary TEXT;

-- Update RLS grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
