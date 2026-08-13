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
  const [waTemplate, setWaTemplate] = useState(DEFAULT_WA_TEMPLATE);

  const list = useMemo(() => orders ?? [], [orders]);
  const filtered = useMemo(() => applyFilters(list, filters), [list, filters]);

  const products = useMemo(() => [...new Set(list.map((o) => o.product_name))], [list]);
  const cities = useMemo(() => [...new Set(list.map((o) => o.city))], [list]);
  const assignees = useMemo(
    () => [...new Set(list.map((o) => o.assignee).filter((a): a is string => !!a))],
    [list],
  );

  return (
    <AppShell title="Contactos" description={`${filtered.length} contactos encontrados`}>
      <div className="space-y-4">
        <OrderFilters
          value={filters}
          onChange={setFilters}
          products={products}
          cities={cities}
          assignees={assignees}
        />

        <div className="max-w-xl space-y-1.5 rounded-xl border border-border bg-muted/20 p-4">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mensagem padrão de WhatsApp</Label>
          <Textarea
            rows={2}
            value={waTemplate}
            onChange={(e) => setWaTemplate(e.target.value)}
            placeholder="Use {CLIENTE} e {PRODUTO}"
            className="bg-background"
          />
        </div>


        {isLoading ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : (
          <OrdersTable
            orders={filtered}
            waTemplate={waTemplate}
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
