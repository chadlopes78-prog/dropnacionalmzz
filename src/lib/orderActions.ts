import { supabase } from "@/integrations/supabase/client";
import type { OrderStatus } from "@/lib/domain";

export interface OrderPatch {
  status?: OrderStatus;
  assignee?: string | null;
  cancel_reason?: string | null;
  callback_at?: string | null;
  delivered_at?: string | null;
}

/**
 * Actualiza uma encomenda. O histórico é escrito automaticamente pela base de
 * dados sempre que o estado muda, por isso aqui apenas enviamos o patch.
 */
export async function updateOrder(id: string, patch: OrderPatch): Promise<void> {
  const { error } = await supabase.from("orders").update(patch).eq("id", id);
  if (error) throw error;
}

/** Marca como entregue: é este momento que transforma a encomenda em VENDA. */
export async function markDelivered(id: string): Promise<void> {
  await updateOrder(id, { status: "entregue", delivered_at: new Date().toISOString() });
}

export async function addNote(orderId: string, content: string, author?: string): Promise<void> {
  const { error } = await supabase
    .from("order_notes")
    .insert({ order_id: orderId, content, author: author ?? null });
  if (error) throw error;
}

export async function addEvent(orderId: string, description: string): Promise<void> {
  const { error } = await supabase
    .from("order_events")
    .insert({ order_id: orderId, description });
  if (error) throw error;
}

/** Datas sugeridas para uma nova tentativa de chamada. */
export function retryPresets(): { label: string; value: Date }[] {
  const now = new Date();
  const plus = (mins: number) => new Date(now.getTime() + mins * 60000);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const later = new Date(now);
  later.setHours(Math.min(now.getHours() + 4, 19), 0, 0, 0);
  return [
    { label: "Daqui a 30 minutos", value: plus(30) },
    { label: "Daqui a 1 hora", value: plus(60) },
    { label: "Hoje mais tarde", value: later },
    { label: "Amanhã de manhã", value: tomorrow },
  ];
}

/** Converte um Date para o formato aceite por <input type="datetime-local">. */
export function toLocalInput(date: Date): string {
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60000).toISOString().slice(0, 16);
}
