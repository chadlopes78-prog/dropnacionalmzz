-- 1. Papéis de equipa numa tabela dedicada (nunca no perfil/utilizador)
CREATE TYPE public.app_role AS ENUM ('administrador', 'gestor', 'operador', 'entregador');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Funções de verificação (SECURITY DEFINER para evitar recursão nas policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Membro verificado da equipa = tem qualquer função atribuída.
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE POLICY "Users read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins grant roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins revoke roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrador') AND user_id <> auth.uid());

-- 3. Arranque: a primeira conta pode tornar-se administradora (só se ainda não existir nenhum).
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles) THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (v_uid, 'administrador')
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

-- 4. Substituir as policies permissivas USING (true) por verificação de equipa
DROP POLICY IF EXISTS "Team can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Team can manage products" ON public.products;
DROP POLICY IF EXISTS "Team can view products" ON public.products;
DROP POLICY IF EXISTS "Team can manage notes" ON public.order_notes;
DROP POLICY IF EXISTS "Team can manage events" ON public.order_events;
DROP POLICY IF EXISTS "Team can manage team members" ON public.team_members;

CREATE POLICY "Staff manage orders"
  ON public.orders FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff manage products"
  ON public.products FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff manage notes"
  ON public.order_notes FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff manage events"
  ON public.order_events FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff read team members"
  ON public.team_members FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Managers manage team members"
  ON public.team_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'gestor'));

-- 5. Checkout público: preços recalculados no servidor, nunca confiando no cliente
CREATE OR REPLACE FUNCTION public.enforce_order_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
BEGIN
  SELECT price, promo_price, delivery_cost, name, active
    INTO p
  FROM public.products
  WHERE id = NEW.product_id;

  IF NOT FOUND OR NOT p.active THEN
    RAISE EXCEPTION 'Produto indisponível para encomenda.';
  END IF;

  NEW.product_name  := p.name;
  NEW.unit_price    := COALESCE(p.promo_price, p.price);
  NEW.delivery_cost := p.delivery_cost;
  NEW.total         := (NEW.unit_price * NEW.quantity) + NEW.delivery_cost;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_enforce_pricing
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_pricing();

CREATE POLICY "Public checkout can create orders"
  ON public.orders FOR INSERT TO anon
  WITH CHECK (
    status = 'nova'
    AND assignee IS NULL
    AND cancel_reason IS NULL
    AND delivered_at IS NULL
    AND product_id IS NOT NULL
    AND quantity BETWEEN 1 AND 20
    AND length(trim(customer_name)) BETWEEN 2 AND 120
    AND phone ~ '^8[2-7][0-9]{7}$'
    AND length(trim(province)) BETWEEN 2 AND 80
    AND length(trim(city)) BETWEEN 2 AND 80
    AND length(trim(neighborhood)) BETWEEN 2 AND 120
    AND (reference_point IS NULL OR length(reference_point) <= 300)
  );

-- 6. Trancar a execução das funções internas expostas via API
REVOKE ALL ON FUNCTION public.log_order_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_order_pricing() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_order_receipt(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
-- Recibo público: só devolve UMA encomenda e exige o identificador exacto (UUID não adivinhável).
GRANT EXECUTE ON FUNCTION public.get_order_receipt(uuid) TO anon, authenticated;