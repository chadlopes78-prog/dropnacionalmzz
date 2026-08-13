import { Phone, MessageCircle, CheckCircle2, PhoneOff, CalendarClock, XCircle, PackageCheck, AlertCircle } from "lucide-react";
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
  formatDateTime,
  formatMT,
  telLink,
  whatsappLink,
  buildWaMessage,
  DEFAULT_WA_TEMPLATE
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
        Nenhum contacto encontrado nesta aba.
      </p>
    );
  }

  // Ordenação: POR LIGAR com callback_at passado vêm primeiro (ATRASADOS)
  const sortedOrders = [...orders].sort((a, b) => {
    const now = new Date();
    
    // Verificação de atraso para agendados
    const isLateA = a.status === 'agendada' && a.callback_at && new Date(a.callback_at) < now;
    const isLateB = b.status === 'agendada' && b.callback_at && new Date(b.callback_at) < now;

    if (isLateA && !isLateB) return -1;
    if (!isLateA && isLateB) return 1;
    
    // Por defeito, mais recentes primeiro
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Desktop View */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card lg:block shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-bold">Cliente</TableHead>
              <TableHead className="font-bold">Telefone</TableHead>
              <TableHead className="font-bold">Província</TableHead>
              <TableHead className="font-bold">Produto</TableHead>
              <TableHead className="font-bold">Próxima Ligação</TableHead>
              <TableHead className="font-bold">Estado</TableHead>
              <TableHead className="text-right font-bold">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.map((o) => {
              const now = new Date();
              const isLate = o.status === 'agendada' && o.callback_at && new Date(o.callback_at) < now;
              
              return (
                <TableRow key={o.id} className="cursor-pointer hover:bg-muted/20" onClick={() => onSelect(o)}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{o.customer_name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDateTime(o.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-blue-600">
                    <div className="flex flex-col">
                      <span>+258 {o.phone}</span>
                      {o.phone_secondary && <span className="text-[10px] text-muted-foreground">+258 {o.phone_secondary}</span>}
                    </div>
                  </TableCell>
                  <TableCell>{o.province}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{o.product_name}</span>
                      <span className="text-[10px] text-muted-foreground">{o.quantity} un · {formatMT(o.total)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isLate ? (
                      <div className="flex items-center gap-1.5 text-red-600 font-bold animate-pulse">
                        <AlertCircle className="size-3" />
                        <span className="text-xs">ATRASADA</span>
                      </div>
                    ) : (
                      <span className="text-xs font-medium">
                        {o.callback_at ? formatDateTime(o.callback_at).split(' ')[1] : (o.contact_slot ?? "—")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" className="h-8 gap-1 font-bold bg-blue-50 text-blue-700 border-blue-200" asChild>
                        <a href={telLink(o.phone)}>
                          <Phone className="size-3.5" /> Ligar
                        </a>
                      </Button>
                      <Button size="sm" variant="secondary" className="h-8 font-bold" onClick={() => onSelect(o)}>
                        Gerir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile/Tablet View (Cards) */}
      <div className="grid gap-4 lg:hidden">
        {sortedOrders.map((o) => {
          const now = new Date();
          const isLate = o.status === 'agendada' && o.callback_at && new Date(o.callback_at) < now;
          
          return (
            <div
              key={o.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm active:scale-[0.98] transition-transform"
              onClick={() => onSelect(o)}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <h3 className="text-lg font-black text-foreground">{o.customer_name}</h3>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-blue-600">+258 {o.phone}</p>
                    {o.phone_secondary && <p className="text-[10px] font-medium text-muted-foreground">+258 {o.phone_secondary}</p>}
                  </div>
                </div>
                <StatusBadge status={o.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 border-y border-border/50 py-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Localização</span>
                  <span className="text-sm font-bold">{o.province} · {o.city}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Encomenda</span>
                  <span className="text-sm font-bold truncate">{o.product_name} · {o.quantity}un</span>
                </div>
                <div className="col-span-2 flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Próxima Ligação / Horário</span>
                  <div className="flex items-center gap-2">
                    {isLate && <AlertCircle className="size-4 text-red-600 animate-pulse" />}
                    <span className={`text-sm font-black ${isLate ? 'text-red-600' : 'text-primary'}`}>
                      {isLate ? "⚠️ LIGAÇÃO ATRASADA" : (o.callback_at ? formatDateTime(o.callback_at) : (o.contact_slot ?? o.contact_period ?? "A qualquer hora"))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acções principais solicitadas */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button variant="default" className="font-black h-11" asChild onClick={(e) => e.stopPropagation()}>
                  <a href={telLink(o.phone)}>
                    <Phone className="size-4 mr-2" /> LIGAR
                  </a>
                </Button>
                <Button variant="outline" className="font-black h-11 border-2" onClick={(e) => { e.stopPropagation(); onSelect(o); }}>
                  GERIR
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
