import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderDrawer } from "@/components/orders/OrderDrawer";
import {
  EMPTY_FILTERS,
  OrderFilters,
  applyFilters,
  type FiltersState,
} from "@/components/orders/OrderFilters";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders, type Order } from "@/hooks/useOrders";
import { DEFAULT_WA_TEMPLATE } from "@/lib/domain";


export const Route = createFileRoute("/_authenticated/contactos")({
  head: () => ({
    meta: [
      { title: "Contactos de clientes | Drop Nacional" },
      {
        name: "description",
        content: "Todos os clientes que fizeram encomendas, com chamada directa e WhatsApp.",
      },
      { property: "og:title", content: "Contactos de clientes | Drop Nacional" },
      { property: "og:description", content: "Base de contactos da operação de encomendas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const { data: orders, isLoading } = useOrders();
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);

  const list = useMemo(() => orders ?? [], [orders]);
  const filtered = useMemo(() => applyFilters(list, filters), [list, filters]);

  // Contagens para os cards de resumo
  const stats = useMemo(() => {
    return {
      total: list.length,
      novos: list.filter((o) => o.status === "nova").length,
      porLigar: list.filter((o) => o.status === "por_ligar" || o.status === "agendada").length,
      confirmados: list.filter((o) => o.status === "confirmada").length,
      emEntrega: list.filter((o) => o.status === "em_entrega").length,
      entregues: list.filter((o) => o.status === "entregue").length,
    };
  }, [list]);

  const products = useMemo(() => [...new Set(list.map((o) => o.product_name))], [list]);
  const cities = useMemo(() => [...new Set(list.map((o) => o.city))], [list]);
  const assignees = useMemo(
    () => [...new Set(list.map((o) => o.assignee).filter((a): a is string => !!a))],
    [list],
  );

  return (
    <AppShell title="Painel de Acompanhamento" description="Gira os seus contactos desde o checkout até à entrega">
      <div className="space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Todos" value={stats.total} onClick={() => setFilters({ ...filters, status: "todos" })} active={filters.status === "todos"} />
          <StatCard label="Novos" value={stats.novos} tone="new" onClick={() => setFilters({ ...filters, status: "nova" })} active={filters.status === "nova"} />
          <StatCard label="Por Ligar" value={stats.porLigar} tone="warn" onClick={() => setFilters({ ...filters, status: "por_ligar" })} active={filters.status === "por_ligar"} />
          <StatCard label="Confirmados" value={stats.confirmados} tone="ok" onClick={() => setFilters({ ...filters, status: "confirmada" })} active={filters.status === "confirmada"} />
          <StatCard label="Em Entrega" value={stats.emEntrega} tone="info" onClick={() => setFilters({ ...filters, status: "em_entrega" })} active={filters.status === "em_entrega"} />
          <StatCard label="Entregues" value={stats.entregues} tone="ok" onClick={() => setFilters({ ...filters, status: "entregue" })} active={filters.status === "entregue"} />
        </div>

        <OrderFilters
          value={filters}
          onChange={setFilters}
          products={products}
          cities={cities}
          assignees={assignees}
        />

        {isLoading ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : (
          <OrdersTable
            orders={filtered}
            onSelect={(o) => {
              setSelected(o);
              setOpen(true);
            }}
          />
        )}
      </div>

      <OrderDrawer
        order={selected ? (list.find((o) => o.id === selected.id) ?? selected) : null}
        allOrders={list}
        open={open}
        onOpenChange={setOpen}
      />
    </AppShell>
  );
}

function StatCard({ label, value, tone, onClick, active }: { label: string; value: number; tone?: string; onClick: () => void; active?: boolean }) {
  const colors = {
    new: "border-blue-200 bg-blue-50 text-blue-700",
    warn: "border-orange-200 bg-orange-50 text-orange-700",
    ok: "border-green-200 bg-green-50 text-green-700",
    info: "border-cyan-200 bg-cyan-50 text-cyan-700",
    neutral: "border-border bg-card text-foreground",
  };

  const colorClass = tone && colors[tone as keyof typeof colors] ? colors[tone as keyof typeof colors] : colors.neutral;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all active:scale-95 ${
        active ? "ring-2 ring-primary ring-offset-2" : ""
      } ${colorClass}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
      <span className="mt-1 text-2xl font-black">{value}</span>
    </button>
  );
}

