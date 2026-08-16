import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/useRoles";

export type InviteStatus = "pendente" | "aceite" | "rejeitado";

export interface TeamInvite {
  id: string;
  invitee_user_id: string;
  role: AppRole;
  status: InviteStatus;
  invited_by: string | null;
  created_at: string;
  responded_at: string | null;
}

/** Identificador da conta autenticada (partilhado com o administrador para receber convites). */
export function useMyUserId() {
  return useQuery({
    queryKey: ["my_user_id"],
    queryFn: async (): Promise<string | null> => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
  });
}

/** Convites recebidos pela conta autenticada (RLS: só devolve os próprios). */
export function useMyInvites() {
  return useQuery({
    queryKey: ["my_invites"],
    queryFn: async (): Promise<TeamInvite[]> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const { data, error } = await supabase
        .from("team_invites")
        .select("id, invitee_user_id, role, status, invited_by, created_at, responded_at")
        .eq("invitee_user_id", auth.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeamInvite[];
    },
  });
}

/** Todos os convites — só administradores obtêm linhas, por policy. */
export function useAllInvites() {
  return useQuery({
    queryKey: ["team_invites"],
    queryFn: async (): Promise<TeamInvite[]> => {
      const { data, error } = await supabase
        .from("team_invites")
        .select("id, invitee_user_id, role, status, invited_by, created_at, responded_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeamInvite[];
    },
  });
}

/** Aceitar ou rejeitar um convite. A atribuição da função acontece no servidor. */
export function useRespondInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const { data, error } = await supabase.rpc("respond_team_invite", {
        p_invite_id: id,
        p_accept: accept,
      });
      if (error) throw error;
      if (data !== true) throw new Error("Convite já respondido ou indisponível.");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my_invites"] });
      void qc.invalidateQueries({ queryKey: ["my_roles"] });
      void qc.invalidateQueries({ queryKey: ["team_invites"] });
    },
  });
}
