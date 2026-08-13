ALTER TABLE public.products 
ADD COLUMN show_stock_warning BOOLEAN DEFAULT false,
ADD COLUMN stock_urgency_message TEXT DEFAULT 'A previsão é que o stock termine ainda hoje.',
ADD COLUMN continue_selling_no_stock BOOLEAN DEFAULT false,
ADD COLUMN show_recent_activity BOOLEAN DEFAULT false,
ADD COLUMN recent_activity_frequency INTEGER DEFAULT 30,
ADD COLUMN testimonials JSONB DEFAULT '[]'::jsonb;

-- Function to handle stock decrement
CREATE OR REPLACE FUNCTION public.handle_order_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_stock INTEGER;
    v_continue BOOLEAN;
BEGIN
    SELECT stock, continue_selling_no_stock INTO v_stock, v_continue
    FROM public.products
    WHERE id = NEW.product_id;

    IF v_stock < NEW.quantity AND NOT v_continue THEN
        RAISE EXCEPTION 'Produto temporariamente esgotado';
    END IF;

    UPDATE public.products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_created_decrement_stock
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_stock();
