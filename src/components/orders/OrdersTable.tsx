import { Phone, MessageCircle, MoreHorizontal, MapPin, ShoppingBag, Clock } from "lucide-react";
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

export function OrdersTable({
  orders,
  onSelect,
  waTemplate = DEFAULT_WA_TEMPLATE,
}: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhum contacto encontrado com estes filtros.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop View */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Província</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id} className="cursor-pointer" onClick={() => onSelect(o)}>
                <TableCell className="font-semibold">
                  <div className="flex items-center gap-2">
                    {o.status === "por_ligar" && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" title="NOVO" />
                    )}
                    {o.customer_name}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">+258 {o.phone}</TableCell>
                <TableCell>{o.province}</TableCell>
                <TableCell>{o.city}</TableCell>
                <TableCell className="max-w-40 truncate">{o.product_name}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {o.contact_slot ?? o.contact_period ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {formatDateTime(o.created_at)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={o.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-blue-600 hover:bg-blue-50"
                      asChild
                    >
                      <a href={telLink(o.phone)} title="Ligar">
                        <Phone className="size-4" />
                      </a>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-green-600 hover:bg-green-50"
                      asChild
                    >
                      <a
                        href={whatsappLink(
                          o.phone,
                          buildWaMessage(waTemplate, o.customer_name, o.product_name)
                        )}
                        target="_blank"
                        rel="noreferrer"
                        title="WhatsApp"
                      >
                        <MessageCircle className="size-4" />
                      </a>
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8" onClick={() => onSelect(o)}>
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile/Tablet View (Cards) */}
      <div className="grid gap-3 lg:hidden">
        {orders.map((o) => (
          <div
            key={o.id}
            className="group relative flex flex-col rounded-2xl border border-border bg-card p-4 transition-all active:scale-[0.98]"
            onClick={() => onSelect(o)}
          >
            {/* Header: Nome e Badge Novo */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-foreground">
                  {o.customer_name}
                  {o.status === "por_ligar" && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                      NOVO
                    </span>
                  )}
                </h3>
                <p className="mt-0.5 text-sm font-medium text-muted-foreground">+258 {o.phone}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>

            {/* Content Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-y border-border/50 py-3">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 text-muted-foreground" />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">{o.province}</p>
                  <p className="text-muted-foreground">{o.city}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShoppingBag className="mt-0.5 size-3.5 text-muted-foreground" />
                <div className="text-xs">
                  <p className="font-semibold text-foreground truncate">{o.product_name}</p>
                  <p className="text-muted-foreground">{o.quantity} unidade(s)</p>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" />
                <p className="text-xs font-medium text-foreground">
                  Melhor horário: <span className="text-primary">{o.contact_slot ?? o.contact_period ?? "A qualquer hora"}</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2 font-bold"
                onClick={(e) => e.stopPropagation()}
                asChild
              >
                <a href={telLink(o.phone)}>
                  <Phone className="size-4" /> LIGAR
                </a>
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 font-bold text-green-600 border-green-200 hover:bg-green-50"
                onClick={(e) => e.stopPropagation()}
                asChild
              >
                <a
                  href={whatsappLink(
                    o.phone,
                    buildWaMessage(waTemplate, o.customer_name, o.product_name)
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border border-border"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(o);
                }}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
