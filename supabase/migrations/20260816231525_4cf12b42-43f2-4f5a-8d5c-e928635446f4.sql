INSERT INTO public.user_roles (user_id, role)
SELECT id, 'administrador'::app_role FROM auth.users WHERE lower(email) = 'chadlopesff@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;