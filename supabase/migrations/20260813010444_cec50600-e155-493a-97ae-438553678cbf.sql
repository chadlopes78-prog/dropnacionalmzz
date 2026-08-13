ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS action_button_text TEXT DEFAULT 'Comprar Agora',
ADD COLUMN IF NOT EXISTS action_button_color TEXT DEFAULT '#0D9488';

-- Update existing rows to have the default values
UPDATE public.products 
SET action_button_text = 'Comprar Agora', 
    action_button_color = '#0D9488'
WHERE action_button_text IS NULL;