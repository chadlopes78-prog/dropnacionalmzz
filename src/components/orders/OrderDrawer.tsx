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
          <SheetHeader className="border-b border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-bold">
                #{order.order_number}
              </SheetTitle>
              <StatusBadge status={order.status} />
            </div>
            <SheetDescription className="text-xs">
              Recebida em {formatDateTime(order.created_at)}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 overflow-y-auto p-4 pb-24">
            <CustomerInsights order={order} allOrders={allOrders} />

            {/* Acções principais de contacto */}
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" className="h-12 gap-2 font-bold" asChild>
                <a href={telLink(order.phone)}>
                  <Phone className="size-5" /> Ligar
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 gap-2 font-bold text-green-600 border-green-200 hover:bg-green-50"
                asChild
              >
                <a href={whatsappLink(order.phone, waMessage)} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-5" /> WhatsApp
                </a>
              </Button>
            </div>

            {/* Gestão de Estado Rápida */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={() =>
                  run(() => updateOrder(order.id, { status: "confirmada" }), "Encomenda confirmada")
                }
              >
                <CheckCircle2 className="size-4 text-green-600" /> Confirmar
              </Button>
              <Button variant="secondary" size="sm" className="gap-2" onClick={() => setRetryOpen(true)}>
                <PhoneOff className="size-4 text-orange-500" /> Não atende
              </Button>
              <Button variant="secondary" size="sm" className="gap-2" onClick={() => setRetryOpen(true)}>
                <CalendarClock className="size-4 text-blue-500" /> Reagendar
              </Button>
              <Button variant="secondary" size="sm" className="gap-2" onClick={() => setCancelOpen(true)}>
                <XCircle className="size-4 text-red-500" /> Cancelar
              </Button>
              <Button
                className="col-span-2 h-11 font-bold"
                onClick={() => run(() => markDelivered(order.id), "Encomenda marcada como entregue")}
              >
                <PackageCheck className="size-5" /> Marcar como entregue
              </Button>
            </div>

            <Separator />

            {/* Informação Detalhada em Secções */}
            <div className="space-y-6">
              {/* Cliente e Localização */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cliente e Localização</h3>
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <DetailRow label="Nome" value={order.customer_name} />
                  <DetailRow label="Telefone" value={`+258 ${order.phone}`} />
                  <Separator className="opacity-50" />
                  <DetailRow label="Província" value={order.province} />
                  <DetailRow label="Cidade / Distrito" value={order.city} />
                  <DetailRow label="Bairro" value={order.neighborhood} />
                  <DetailRow label="Ponto de Referência" value={order.reference_point ?? "Não informado"} />
                </div>
              </section>

              {/* Encomenda */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Encomenda</h3>
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <DetailRow label="Produto" value={order.product_name} />
                  <DetailRow label="Quantidade" value={`${order.quantity} unidades`} />
                  <DetailRow label="Preço Unitário" value={formatMT(order.unit_price)} />
                  <DetailRow label="Taxa de Entrega" value={formatMT(order.delivery_cost)} />
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="font-bold text-foreground">Total a cobrar</span>
                    <span className="text-lg font-black text-primary">{formatMT(order.total)}</span>
                  </div>
                </div>
              </section>

              {/* Contacto e Gestão */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contacto e Gestão</h3>
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <DetailRow 
                    label="Melhor horário" 
                    value={order.contact_slot ?? order.contact_period ?? "A qualquer hora"} 
                  />
                  <DetailRow 
                    label="Chamada agendada" 
                    value={order.callback_at ? formatDateTime(order.callback_at) : "Sem agendamento"} 
                  />
                  <Separator className="opacity-50" />
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase">Responsável</Label>
                    <Select
                      value={order.assignee ?? "__none"}
                      onValueChange={(v) =>
                        run(
                          () => updateOrder(order.id, { assignee: v === "__none" ? null : v }),
                          "Responsável actualizado",
                        )
                      }
                    >
                      <SelectTrigger className="h-9">
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
              </section>

              {/* Notas Internas */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notas Internas</h3>
                <div className="space-y-3">
                  <Textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Adicionar uma nota interna..."
                    className="resize-none"
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!note.trim()}
                    onClick={() =>
                      run(async () => {
                        await addNote(order.id, note.trim());
                        setNote("");
                      }, "Nota adicionada")
                    }
                  >
                    Guardar nota
                  </Button>
                  <div className="space-y-2">
                    {(notes ?? []).map((n) => (
                      <div key={n.id} className="rounded-lg bg-muted/40 p-3 text-sm">
                        <p className="text-foreground">{n.content}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatDateTime(n.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Histórico */}
              <section className="space-y-3 pb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Histórico de Alterações</h3>
                <div className="relative space-y-4 border-l-2 border-muted pl-4 ml-2">
                  {(events ?? []).map((ev) => (
                    <div key={ev.id} className="relative">
                      <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                      <p className="text-[10px] font-medium text-muted-foreground">
                        {formatDateTime(ev.created_at)}
                      </p>
                      <p className="text-sm font-medium text-foreground">{ev.description}</p>
                    </div>
                  ))}
                </div>
              </section>
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

