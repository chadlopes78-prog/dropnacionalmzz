CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitee_user_id uuid NOT NULL,
  role app_role NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

CREATE UNIQUE INDEX team_invites_unique_pending
  ON public.team_invites (invitee_user_id, role)
  WHERE status = 'pendente';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invites TO authenticated;
GRANT ALL ON public.team_invites TO service_role;

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invites" ON public.team_invites
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'administrador'::app_role))
  WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Invitee reads own invites" ON public.team_invites
  FOR SELECT TO authenticated
  USING (invitee_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.respond_team_invite(p_invite_id uuid, p_accept boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_inv RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_inv
  FROM public.team_invites
  WHERE id = p_invite_id AND invitee_user_id = v_uid AND status = 'pendente'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF p_accept THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (v_uid, v_inv.role)
    ON CONFLICT DO NOTHING;
    UPDATE public.team_invites SET status = 'aceite', responded_at = now() WHERE id = p_invite_id;
  ELSE
    UPDATE public.team_invites SET status = 'rejeitado', responded_at = now() WHERE id = p_invite_id;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_team_invite(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_team_invite(uuid, boolean) TO authenticated;