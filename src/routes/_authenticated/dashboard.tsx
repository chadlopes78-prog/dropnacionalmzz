import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PhoneCall, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders, type Order } from "@/hooks/useOrders";
import { formatMT, telLink, timeAgo, TO_CALL_STATUSES } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard de encomendas | Drop Nacional" },
      {
        name: "description",
        content:
          "Visão geral das encomendas, confirmações, entregas e receita realizada com pagamento na entrega.",
      },
      { property: "og:title", content: "Dashboard de encomendas | Drop Nacional" },
      { property: "og:description", content: "Gestão diária de encomendas em Moçambique." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
}

function DashboardPage() {
  const { data: orders, isLoading } = useOrders();
  const list = useMemo<Order[]>(() => orders ?? [], [orders]);

  const stats = useMemo(() => {
    const count = (fn: (o: Order) => boolean) => list.filter(fn).length;
    const delivered = list.filter((o) => o.status === "entregue");
    const confirmedOrLater = list.filter((o) =>
      ["confirmada", "preparacao", "em_entrega", "entregue"].includes(o.status),
    );
    // RECEITA = apenas encomendas ENTREGUES (o cliente paga na entrega).
    const revenue = delivered.reduce((sum, o) => sum + Number(o.total), 0);
    return {
      today: count((o) => isToday(o.created_at)),
      nova: count((o) => o.status === "nova"),
      porLigar: count((o) => TO_CALL_STATUSES.includes(o.status as never)),
      confirmadas: count((o) => o.status === "confirmada"),
      naoAtende: count((o) => o.status === "nao_atende"),
      preparacao: count((o) => o.status === "preparacao"),
      emEntrega: count((o) => o.status === "em_entrega"),
      entregues: delivered.length,
      canceladas: count((o) => o.status === "cancelada" || o.status === "recusada"),
      revenue,
      confirmRate: list.length ? (confirmedOrLater.length / list.length) * 100 : 0,
      deliveryRate: list.length ? (delivered.length / list.length) * 100 : 0,
      cancelRate: list.length
        ? (count((o) => o.status === "cancelada" || o.status === "recusada") / list.length) * 100
        : 0,
      avgTicket: delivered.length ? revenue / delivered.length : 0,
    };
  }, [list]);

  const daily = useMemo(() => {
    const map = new Map<string, { day: string; encomendas: number; entregues: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d.toISOString());
      map.set(key, { day: key, encomendas: 0, entregues: 0 });
    }
    for (const o of list) {
      const key = dayKey(o.created_at);
      const row = map.get(key);
      if (row) row.encomendas += 1;
      if (o.delivered_at) {
        const dk = dayKey(o.delivered_at);
        const drow = map.get(dk);
        if (drow) drow.entregues += 1;
      }
    }
    return [...map.values()];
  }, [list]);

  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of list.filter((x) => x.status === "entregue")) {
      map.set(o.product_name, (map.get(o.product_name) ?? 0) + o.quantity);
    }
    return [...map.entries()]
      .map(([produto, unidades]) => ({ produto, unidades }))
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 6);
  }, [list]);

  const callsToday = useMemo(
    () =>
      list.filter(
        (o) =>
          TO_CALL_STATUSES.includes(o.status as never) &&
          (!o.callback_at || new Date(o.callback_at) <= new Date()),
      ),
    [list],
  );

  return (
    <AppShell
      title="Dashboard"
      description="Encomenda não é venda. A receita só conta quando o estado passa a Entregue."
    >
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Stat label="Encomendas de hoje" value={stats.today} />
            <Stat label="Novas encomendas" value={stats.nova} tone="new" />
            <Stat label="Por ligar" value={stats.porLigar} tone="warn" />
            <Stat label="Confirmadas" value={stats.confirmadas} tone="ok" />
            <Stat label="Não atende" value={stats.naoAtende} tone="warn" />
            <Stat label="Em preparação" value={stats.preparacao} tone="info" />
            <Stat label="Em entrega" value={stats.emEntrega} tone="info" />
            <Stat label="Entregues" value={stats.entregues} tone="ok" />
            <Stat label="Canceladas" value={stats.canceladas} tone="danger" />
            <Stat label="Receita entregue" value={formatMT(stats.revenue)} tone="ok" />
            <Stat label="Taxa confirmação" value={`${stats.confirmRate.toFixed(1)}%`} />
            <Stat label="Taxa entrega" value={`${stats.deliveryRate.toFixed(1)}%`} />
            <Stat label="Taxa cancelam." value={`${stats.cancelRate.toFixed(1)}%`} />
            <Stat label="Ticket médio" value={formatMT(stats.avgTicket)} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Encomendas e entregas por dia</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="day" fontSize={11} stroke="var(--color-muted-foreground)" />
                    <YAxis allowDecimals={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="encomendas"
                      stroke="var(--color-chart-1)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="entregues"
                      stroke="var(--color-chart-2)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Produtos mais vendidos (entregues)</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="produto" fontSize={11} stroke="var(--color-muted-foreground)" />
                    <YAxis allowDecimals={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                    <Tooltip />
                    <Bar dataKey="unidades" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-primary" aria-hidden /> Ligações de hoje (
                {callsToday.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {callsToday.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma chamada pendente.</p>
              ) : (
                callsToday.slice(0, 10).map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {o.customer_name} · {o.product_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.city} · {o.contact_slot ?? o.contact_period ?? "sem horário"} ·{" "}
                        {timeAgo(o.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={o.status} />
                      <a href={telLink(o.phone)}>
                        <Button size="sm">
                          <PhoneCall className="size-4" /> Ligar
                        </Button>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "new" | "info" | "warn" | "ok" | "danger";
}) {
  const toneClass = {
    neutral: "text-foreground",
    new: "text-status-new",
    info: "text-status-info",
    warn: "text-status-warn",
    ok: "text-status-ok",
    danger: "text-status-danger",
  }[tone];
  return (
    <Card className="gap-2 py-4">
      <CardContent className="px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
