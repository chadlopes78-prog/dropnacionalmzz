DROP FUNCTION IF EXISTS public.get_order_receipt(uuid);

CREATE OR REPLACE FUNCTION public.get_order_receipt(p_id uuid)
 RETURNS TABLE(
   city text, 
   created_at timestamptz, 
   customer_name text, 
   delivery_cost numeric, 
   id uuid, 
   neighborhood text, 
   order_number integer, 
   phone text, 
   phone_secondary text, 
   product_name text, 
   province text, 
   quantity integer, 
   reference_point text, 
   total numeric, 
   unit_price numeric
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select 
    city, 
    created_at, 
    customer_name, 
    delivery_cost, 
    id, 
    neighborhood, 
    order_number, 
    phone, 
    phone_secondary,
    product_name, 
    province, 
    quantity, 
    reference_point, 
    total, 
    unit_price
  from public.orders
  where id = p_id
$function$;

REVOKE ALL ON FUNCTION public.get_order_receipt(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_receipt(uuid) TO anon, authenticated, service_role;
