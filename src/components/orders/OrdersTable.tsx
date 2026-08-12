import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import type { Order } from "@/hooks/useOrders";
import {
  DEFAULT_WA_TEMPLATE,
  buildWaMessage,
  formatDateTime,
  formatMT,
  telLink,
  whatsappLink,
} from "@/lib/domain";

export interface OrdersTableProps {
  orders: Order[];
  onSelect: (order: Order) => void;
  waTemplate?: string;
}

/** Tabela principal de contactos/encomendas, com acções de chamada directa. */
export function OrdersTable({
  orders,
  onSelect,
  waTemplate = DEFAULT_WA_TEMPLATE,
}: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhuma encomenda nesta vista.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead className="text-right">Qtd</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Província</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Bairro</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="text-right">Acções</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow
              key={o.id}
              className="cursor-pointer"
              onClick={() => onSelect(o)}
            >
              <TableCell className="font-medium">{o.customer_name}</TableCell>
              <TableCell className="whitespace-nowrap">+258 {o.phone}</TableCell>
              <TableCell className="max-w-40 truncate">{o.product_name}</TableCell>
              <TableCell className="text-right">{o.quantity}</TableCell>
              <TableCell className="whitespace-nowrap text-right">{formatMT(o.total)}</TableCell>
              <TableCell>{o.province}</TableCell>
              <TableCell>{o.city}</TableCell>
              <TableCell>{o.neighborhood}</TableCell>
              <TableCell className="whitespace-nowrap">
                {o.contact_slot ?? o.contact_period ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDateTime(o.created_at)}</TableCell>
              <TableCell>
                <StatusBadge status={o.status} />
              </TableCell>
              <TableCell>{o.assignee ?? "—"}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                <div className="flex justify-end gap-1">
                  <a href={telLink(o.phone)} aria-label={`Ligar para ${o.customer_name}`}>
                    <Button size="icon" variant="secondary" className="size-8">
                      <Phone className="size-4" />
                    </Button>
                  </a>
                  <a
                    href={whatsappLink(
                      o.phone,
                      buildWaMessage(waTemplate, o.customer_name, o.product_name),
                    )}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`WhatsApp para ${o.customer_name}`}
                  >
                    <Button size="icon" variant="secondary" className="size-8">
                      <MessageCircle className="size-4" />
                    </Button>
                  </a>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
