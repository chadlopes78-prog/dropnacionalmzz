import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

/** Funções atribuídas à conta autenticada (fonte da verdade continua nas policies). */
export function useMyRoles() {
  return useQuery({
    queryKey: ["my_roles"],
    queryFn: async (): Promise<AppRole[]> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", auth.user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role);
    },
  });
}

/** Todas as atribuições de acesso. Só devolve linhas se quem pede for administrador. */
export function useAllRoles() {
  return useQuery({
    queryKey: ["user_roles"],
    queryFn: async (): Promise<UserRoleRow[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Só administradores e gestores veem custos e margens dos produtos. */
export function canSeeCosts(roles: AppRole[] | undefined): boolean {
  return !!roles?.some((r) => r === "administrador" || r === "gestor");
}
