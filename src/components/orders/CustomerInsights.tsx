import { AlertTriangle, Repeat } from "lucide-react";
import { formatMT, formatDateTime } from "@/lib/domain";
import type { Order } from "@/hooks/useOrders";

export interface CustomerInsightsProps {
  order: Order;
  allOrders: Order[];
}

/**
 * Detecta clientes recorrentes (mesmo número) e avisa quando existe um
 * historial de cancelamentos. Nunca bloqueia — a decisão fica com a equipa.
 */
export function CustomerInsights({ order, allOrders }: CustomerInsightsProps) {
  const previous = allOrders.filter((o) => o.phone === order.phone && o.id !== order.id);
  if (previous.length === 0) return null;

  const delivered = previous.filter((o) => o.status === "entregue");
  const cancelled = previous.filter((o) => o.status === "cancelada" || o.status === "recusada");
  const totalBought = delivered.reduce((sum, o) => sum + Number(o.total), 0);
  const last = previous[0];

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-status-info/25 bg-status-info/10 p-3 text-sm">
        <p className="flex items-center gap-2 font-medium text-status-info">
          <Repeat className="size-4" aria-hidden /> Cliente recorrente
        </p>
        <ul className="mt-1.5 space-y-0.5 text-xs text-foreground">
          <li>{previous.length} encomendas anteriores</li>
          <li>{delivered.length} entregues</li>
          <li>{cancelled.length} canceladas</li>
          <li>Total comprado: {formatMT(totalBought)}</li>
          <li>Última encomenda: {formatDateTime(last?.created_at)}</li>
        </ul>
      </div>

      {cancelled.length >= 2 ? (
        <div className="rounded-lg border border-status-danger/25 bg-status-danger/10 p-3 text-sm text-status-danger">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4" aria-hidden /> Atenção: este cliente possui{" "}
            {cancelled.length} encomendas canceladas anteriormente.
          </p>
        </div>
      ) : null}
    </div>
  );
}
