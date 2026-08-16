import { useMemo } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  TrendingUp,
  Percent,
  ShieldCheck,
  Boxes,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrders, useProducts, type Order, type Product } from "@/hooks/useOrders";
import { useAllRoles } from "@/hooks/useRoles";
import { formatMT } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/painel")({
  /**
   * Guarda extra de UI: só administradores veem o painel.
   * A base de dados continua a ser a fonte da verdade (policies em user_roles).
   */
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id)
      .eq("role", "administrador");
    if (!roles || roles.length === 0) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Painel de Controlo | Drop Nacional" },
      {
        name: "description",
        content:
          "Painel exclusivo do administrador: receita, lucro líquido, desempenho por produto e por província.",
      },
      { property: "og:title", content: "Painel de Controlo | Drop Nacional" },
      {
        property: "og:description",
        content: "Indicadores financeiros e operacionais da rede Drop Nacional.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelPage,
});

const CHART_COLORS = [
  "hsl(var(--chart-1, 173 80% 40%))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 197 37% 54%))",
  "hsl(var(--chart-4, 43 74% 56%))",
  "hsl(var(--chart-5, 27 87% 57%))",
];

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}

function MetricCard({ label, value, hint, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-semibold text-foreground">{value}</p>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  );
}

function PainelPage() {
  const { data: orders, isLoading } = useOrders();
  const { data: products } = useProducts();
  const { data: roles } = useAllRoles();

  const list = useMemo<Order[]>(() => orders ?? [], [orders]);
  const catalog = useMemo<Product[]>(() => products ?? [], [products]);

  const costById = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of catalog) map.set(p.id, Number(p.product_cost ?? 0));
    return map;
  }, [catalog]);

  const stats = useMemo(() => {
    const delivered = list.filter((o) => o.status === "entregue");
    const revenue = delivered.reduce((s, o) => s + Number(o.total), 0);
    const cost = delivered.reduce(
      (s, o) =>
        s +
        (costById.get(o.product_id ?? "") ?? 0) * Number(o.quantity) +
        Number(o.delivery_cost ?? 0),
      0,
    );
    const profit = revenue - cost;
    return {
      revenue,
      cost,
      profit,
      margin: revenue ? (profit / revenue) * 100 : 0,
      deliveryRate: list.length ? (delivered.length / list.length) * 100 : 0,
      avgTicket: delivered.length ? revenue / delivered.length : 0,
      delivered: delivered.length,
      total: list.length,
    };
  }, [list, costById]);

  const byProduct = useMemo(() => {
    const map = new Map<string, { name: string; receita: number; lucro: number }>();
    for (const o of list) {
      if (o.status !== "entregue") continue;
      const key = o.product_name;
      const entry = map.get(key) ?? { name: key, receita: 0, lucro: 0 };
      const unitCost = costById.get(o.product_id ?? "") ?? 0;
      entry.receita += Number(o.total);
      entry.lucro += Number(o.total) - unitCost * Number(o.quantity) - Number(o.delivery_cost ?? 0);
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.receita - a.receita).slice(0, 6);
  }, [list, costById]);

  const byProvince = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of list) map.set(o.province, (map.get(o.province) ?? 0) + 1);
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [list]);

  const lowStock = useMemo(
    () => catalog.filter((p) => p.active && !p.continue_selling_no_stock && p.stock <= 5),
    [catalog],
  );

  return (
    <AppShell
      title="Painel de Controlo"
      description="Área exclusiva do administrador"
      actions={
        <Badge variant="outline" className="hidden gap-1 sm:flex">
          <ShieldCheck className="size-3" /> Administrador
        </Badge>
      }
    >
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Receita entregue"
              value={formatMT(stats.revenue)}
              hint={`${stats.delivered} encomendas entregues`}
              icon={Banknote}
            />
            <MetricCard
              label="Lucro líquido"
              value={formatMT(stats.profit)}
              hint={`Custos: ${formatMT(stats.cost)}`}
              icon={TrendingUp}
            />
            <MetricCard
              label="Margem média"
              value={`${stats.margin.toFixed(1)}%`}
              hint={`Ticket médio ${formatMT(stats.avgTicket)}`}
              icon={Percent}
            />
            <MetricCard
              label="Taxa de entrega"
              value={`${stats.deliveryRate.toFixed(1)}%`}
              hint={`${stats.total} encomendas no total`}
              icon={Boxes}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Receita e lucro por produto</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {byProduct.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem entregas registadas ainda.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byProduct}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} height={50} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v: number) => formatMT(Number(v))}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Bar dataKey="receita" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lucro" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Encomendas por província</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {byProvince.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byProvince} dataKey="value" nameKey="name" outerRadius={80} label>
                        {byProvince.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="size-4 text-status-warn" /> Stock crítico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lowStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Todo o stock está saudável.</p>
                ) : (
                  lowStock.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span className="truncate text-foreground">{p.name}</span>
                      <Badge variant={p.stock === 0 ? "destructive" : "outline"}>
                        {p.stock} un.
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="size-4 text-primary" /> Acessos atribuídos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!roles || roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem acessos atribuídos.</p>
                ) : (
                  roles.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {r.user_id.slice(0, 8)}…
                      </span>
                      <Badge variant="secondary">{r.role}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </AppShell>
  );
}
