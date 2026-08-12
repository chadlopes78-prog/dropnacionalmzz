-- Restringe o acesso da loja pública às colunas comerciais dos produtos.
REVOKE SELECT ON public.products FROM anon;

GRANT SELECT (
  id, slug, name, image_url, gallery, short_description,
  price, promo_price, stock, delivery_cost,
  provinces, cities, delivery_time, active, created_at, updated_at
) ON public.products TO anon;

-- Limpeza dos dados usados na verificação de segurança.
DELETE FROM public.order_events WHERE order_id IN (
  SELECT id FROM public.orders WHERE customer_name = 'Teste Seguranca'
);
DELETE FROM public.order_notes WHERE order_id IN (
  SELECT id FROM public.orders WHERE customer_name = 'Teste Seguranca'
);
DELETE FROM public.orders WHERE customer_name = 'Teste Seguranca';
DELETE FROM public.products WHERE slug = 'teste-seguranca-tmp';