import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Guarda da área interna.
 *
 * Ter uma conta autenticada NÃO chega: o acesso aos dados de encomendas exige
 * uma função atribuída na tabela `user_roles` (equipa verificada). As policies
 * da base de dados aplicam a mesma regra do lado do servidor — esta verificação
 * serve apenas para evitar mostrar ecrãs vazios a quem não é da equipa.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // Arranque do projecto: a primeira conta reclama o papel de administrador.
    // A função é ignorada assim que existir qualquer função atribuída.
    await supabase.rpc("claim_first_admin");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    if (!roles || roles.length === 0) {
      throw redirect({ to: "/auth", search: { acesso: "pendente" } });
    }

    return { user: data.user, roles: roles.map((r) => r.role) };
  },
  component: () => <Outlet />,
});
