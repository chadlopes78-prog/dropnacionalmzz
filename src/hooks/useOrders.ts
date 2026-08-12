import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Order = Tables<"orders">;
export type Product = Tables<"products">;
export type OrderNote = Tables<"order_notes">;
export type OrderEvent = Tables<"order_events">;
export type TeamMember = Tables<"team_members">;

/**
 * Subscreve alterações em tempo real de uma tabela e invalida a query
 * correspondente. Fica dentro de useEffect para não criar canais duplicados.
 */
function useRealtime(table: string, queryKey: string) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`rt-${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        void qc.invalidateQueries({ queryKey: [queryKey] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc, table, queryKey]);
}

export function useOrders() {
  useRealtime("orders", "orders");
  return useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProducts() {
  useRealtime("products", "products");
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTeam() {
  return useQuery({
    queryKey: ["team"],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOrderNotes(orderId: string | null) {
  useRealtime("order_notes", "order_notes");
  return useQuery({
    queryKey: ["order_notes", orderId],
    enabled: !!orderId,
    queryFn: async (): Promise<OrderNote[]> => {
      const { data, error } = await supabase
        .from("order_notes")
        .select("*")
        .eq("order_id", orderId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOrderEvents(orderId: string | null) {
  useRealtime("order_events", "order_events");
  return useQuery({
    queryKey: ["order_events", orderId],
    enabled: !!orderId,
    queryFn: async (): Promise<OrderEvent[]> => {
      const { data, error } = await supabase
        .from("order_events")
        .select("*")
        .eq("order_id", orderId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
