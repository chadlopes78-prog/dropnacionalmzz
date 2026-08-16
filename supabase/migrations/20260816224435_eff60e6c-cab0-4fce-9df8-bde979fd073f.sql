CREATE OR REPLACE FUNCTION public.handle_order_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
       SET stock = GREATEST(stock - NEW.quantity, 0)
     WHERE id = NEW.product_id
       AND continue_selling_no_stock = false;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_order_stock() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_order_pricing() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_order_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('administrador'::app_role, 'gestor'::app_role, 'operador'::app_role, 'entregador'::app_role)
  );
$function$;

REVOKE ALL ON TABLE public.orders FROM anon;
GRANT INSERT ON TABLE public.orders TO anon;
REVOKE ALL ON TABLE public.order_notes FROM anon;
REVOKE ALL ON TABLE public.order_events FROM anon;

DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Images" ON storage.objects;

CREATE POLICY "Product images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Staff upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'product-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND public.is_staff(auth.uid()));