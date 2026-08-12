import { useState } from "react";
import { toast } from "sonner";
import {
  Phone,
  MessageCircle,
  CheckCircle2,
  PhoneOff,
  CalendarClock,
  XCircle,
  PackageCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { CustomerInsights } from "@/components/orders/CustomerInsights";
import { useOrderEvents, useOrderNotes, useTeam, type Order } from "@/hooks/useOrders";
import {
  addEvent,
  addNote,
  markDelivered,
  retryPresets,
  toLocalInput,
  updateOrder,
} from "@/lib/orderActions";
import {
  CANCEL_REASONS,
  DEFAULT_WA_TEMPLATE,
  STATUSES,
  buildWaMessage,
  formatDateTime,
  formatMT,
  telLink,
  whatsappLink,
  type OrderStatus,
} from "@/lib/domain";

export interface OrderDrawerProps {
  order: Order | null;
  allOrders: Order[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDrawer({ order, allOrders, open, onOpenChange }: OrderDrawerProps) {
  const { data: notes } = useOrderNotes(order?.id ?? null);
  const { data: events } = useOrderEvents(order?.id ?? null);
  const { data: team } = useTeam();
  const [note, setNote] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>(CANCEL_REASONS[0]);
  const [retryOpen, setRetryOpen] = useState(false);
  const [retryAt, setRetryAt] = useState(() => toLocalInput(new Date()));
  const [retryNote, setRetryNote] = useState("");

  if (!order) return null;

  async function run(action: () => Promise<void>, message: string) {
    try {
      await action();
      toast.success(message);
    } catch {
      toast.error("Não foi possível concluir a acção.");
    }
  }

  const waMessage = buildWaMessage(DEFAULT_WA_TEMPLATE, order.customer_name, order.product_name);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              #{order.order_number} · {order.customer_name}
            </SheetTitle>
            <SheetDescription>
              {order.product_name} · {formatDateTime(order.created_at)}
            </SheetDescription>
            <div className="pt-1">
              <StatusBadge status={order.status} />
            </div>
          </SheetHeader>

          <div className="space-y-5 p-4">
            <CustomerInsights order={order} allOrders={allOrders} />

            {/* Acções rápidas */}
            <div className="grid grid-cols-2 gap-2">
              <a href={telLink(order.phone)}>
                <Button className="w-full" size="lg">
                  <Phone className="size-4" /> Ligar
                </Button>
              </a>
              <a href={whatsappLink(order.phone, waMessage)} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full" size="lg">
                  <MessageCircle className="size-4" /> WhatsApp
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  run(() => updateOrder(order.id, { status: "confirmada" }), "Encomenda confirmada")
                }
              >
                <CheckCircle2 className="size-4" /> Confirmar
              </Button>
              <Button variant="secondary" onClick={() => setRetryOpen(true)}>
                <PhoneOff className="size-4" /> Não atende
              </Button>
              <Button variant="secondary" onClick={() => setRetryOpen(true)}>
                <CalendarClock className="size-4" /> Reagendar
              </Button>
              <Button variant="secondary" onClick={() => setCancelOpen(true)}>
                <XCircle className="size-4" /> Cancelar
              </Button>
              <Button
                className="col-span-2"
                onClick={() => run(() => markDelivered(order.id), "Encomenda marcada como entregue")}
              >
                <PackageCheck className="size-4" /> Marcar como entregue
              </Button>
            </div>

            <Separator />

            {/* Estado e responsável */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={order.status}
                  onValueChange={(v) =>
                    run(
                      () =>
                        v === "entregue"
                          ? markDelivered(order.id)
                          : updateOrder(order.id, { status: v as OrderStatus }),
                      "Estado actualizado",
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Responsável</Label>
                <Select
                  value={order.assignee ?? "__none"}
                  onValueChange={(v) =>
                    run(
                      () => updateOrder(order.id, { assignee: v === "__none" ? null : v }),
                      "Responsável actualizado",
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sem responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Sem responsável</SelectItem>
                    {(team ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Ficha */}
            <div className="space-y-1.5 text-sm">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Ficha do cliente</h3>
              <Row label="Telefone" value={`+258 ${order.phone}`} />
              <Row label="Produto" value={order.product_name} />
              <Row label="Quantidade" value={String(order.quantity)} />
              <Row label="Preço unitário" value={formatMT(order.unit_price)} />
              <Row label="Entrega" value={formatMT(order.delivery_cost)} />
              <Row label="Total a cobrar" value={formatMT(order.total)} />
              <Row label="Província" value={order.province} />
              <Row label="Cidade / Distrito" value={order.city} />
              <Row label="Bairro" value={order.neighborhood} />
              <Row label="Ponto de referência" value={order.reference_point ?? "—"} />
              <Row
                label="Horário preferido"
                value={[order.contact_period, order.contact_slot].filter(Boolean).join(" · ") || "—"}
              />
              <Row label="Data da encomenda" value={formatDateTime(order.created_at)} />
              <Row label="Chamada agendada" value={formatDateTime(order.callback_at)} />
              <Row label="Entregue em" value={formatDateTime(order.delivered_at)} />
              {order.cancel_reason ? (
                <Row label="Motivo do cancelamento" value={order.cancel_reason} />
              ) : null}
            </div>

            <Separator />

            {/* Notas internas */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Notas internas</h3>
              <p className="text-xs text-muted-foreground">
                Visíveis apenas para a equipa. O cliente nunca vê estas notas.
              </p>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex.: Cliente pediu para entregar no trabalho."
              />
              <Button
                size="sm"
                disabled={!note.trim()}
                onClick={() =>
                  run(async () => {
                    await addNote(order.id, note.trim());
                    setNote("");
                  }, "Nota adicionada")
                }
              >
                Adicionar nota
              </Button>
              <ul className="space-y-2 pt-1">
                {(notes ?? []).map((n) => (
                  <li key={n.id} className="rounded-lg border border-border bg-muted/40 p-2.5">
                    <p className="text-sm text-foreground">{n.content}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDateTime(n.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Histórico */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Histórico</h3>
              <ol className="space-y-2 border-l border-border pl-4">
                {(events ?? []).map((ev) => (
                  <li key={ev.id} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateTime(ev.created_at)}
                    </p>
                    <p className="text-foreground">{ev.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancelar com motivo obrigatório */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar encomenda</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo do cancelamento</Label>
            <Select value={cancelReason} onValueChange={setCancelReason}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                run(async () => {
                  await updateOrder(order.id, {
                    status: "cancelada",
                    cancel_reason: cancelReason,
                  });
                  setCancelOpen(false);
                }, "Encomenda cancelada")
              }
            >
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reagendar / não atende */}
      <Dialog open={retryOpen} onOpenChange={setRetryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quando deseja tentar novamente?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {retryPresets().map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setRetryAt(toLocalInput(p.value))}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Data e hora</Label>
              <Input
                type="datetime-local"
                value={retryAt}
                onChange={(e) => setRetryAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nota</Label>
              <Textarea
                rows={2}
                value={retryNote}
                onChange={(e) => setRetryNote(e.target.value)}
                placeholder="Ex.: Cliente pediu para ligar às 18:30."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetryOpen(false)}>
              Voltar
            </Button>
            <Button
              onClick={() =>
                run(async () => {
                  const when = new Date(retryAt).toISOString();
                  await updateOrder(order.id, { status: "agendada", callback_at: when });
                  await addEvent(order.id, `Chamada reagendada para ${formatDateTime(when)}`);
                  if (retryNote.trim()) await addNote(order.id, retryNote.trim());
                  setRetryNote("");
                  setRetryOpen(false);
                }, "Chamada reagendada")
              }
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
