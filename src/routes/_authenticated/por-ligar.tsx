import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PhoneCall, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OrderDrawer } from "@/components/orders/OrderDrawer";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders, type Order } from "@/hooks/useOrders";
import {
  DEFAULT_WA_TEMPLATE,
  TO_CALL_STATUSES,
  buildWaMessage,
  formatDateTime,
  formatMT,
  telLink,
  timeAgo,
  whatsappLink,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/por-ligar")({
  head: () => ({
    meta: [
      { title: "Por ligar | Fila de chamadas do dia" },
      {
        name: "description",
        content: "Fila optimizada de chamadas para confirmar encomendas com os clientes.",
      },
      { property: "og:title", content: "Por ligar | Fila de chamadas" },
      { property: "og:description", content: "Confirme encomendas por telefone rapidamente." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ToCallPage,
});

function ToCallPage() {
  const { data: orders, isLoading } = useOrders();
  const [selected, setSelected] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);

  const list = useMemo(() => orders ?? [], [orders]);
  const queue = useMemo(
    () =>
      list
        .filter((o) => TO_CALL_STATUSES.includes(o.status as never))
        .sort((a, b) => {
          const ax = a.callback_at ? new Date(a.callback_at).getTime() : 0;
          const bx = b.callback_at ? new Date(b.callback_at).getTime() : 0;
          if (ax !== bx) return ax - bx;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }),
    [list],
  );

  return (
    <AppShell title="Por ligar" description={`${queue.length} clientes à espera de contacto`}>
      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : queue.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma chamada pendente. Bom trabalho!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {queue.map((o) => {
            const due = o.callback_at && new Date(o.callback_at) <= new Date();
            return (
              <Card
                key={o.id}
                className={due ? "border-status-warn/50 bg-status-warn/5" : undefined}
              >
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        className="truncate text-left text-base font-semibold text-foreground hover:underline"
                        onClick={() => {
                          setSelected(o);
                          setOpen(true);
                        }}
                      >
                        {o.customer_name}
                      </button>
                      <p className="text-sm text-muted-foreground">+258 {o.phone}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <Info label="Produto" value={o.product_name} />
                    <Info label="Cidade" value={`${o.city} · ${o.province}`} />
                    <Info
                      label="Horário escolhido"
                      value={o.contact_slot ?? o.contact_period ?? "—"}
                    />
                    <Info label="Encomendou" value={timeAgo(o.created_at)} />
                    <Info label="Valor" value={formatMT(o.total)} />
                    {o.callback_at ? (
                      <Info label="Reagendada para" value={formatDateTime(o.callback_at)} />
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <a href={telLink(o.phone)} className="flex-1">
                      <Button size="lg" className="h-12 w-full">
                        <PhoneCall className="size-4" /> LIGAR AGORA
                      </Button>
                    </a>
                    <a
                      href={whatsappLink(
                        o.phone,
                        buildWaMessage(DEFAULT_WA_TEMPLATE, o.customer_name, o.product_name),
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="lg" variant="outline" className="h-12">
                        <MessageCircle className="size-4" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <OrderDrawer
        order={selected ? (list.find((o) => o.id === selected.id) ?? selected) : null}
        allOrders={list}
        open={open}
        onOpenChange={setOpen}
      />
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate text-foreground">{value}</p>
    </div>
  );
}
