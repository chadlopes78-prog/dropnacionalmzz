import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { OrderDrawer } from "@/components/orders/OrderDrawer";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Phone } from "lucide-react";
import { useOrders, type Order } from "@/hooks/useOrders";
import { formatDateTime, formatMT, telLink } from "@/lib/domain";

export interface StageViewProps {
  title: string;
  description: string;
  statuses: string[];
  /** Campos extra a destacar nesta fase da operação. */
  emphasis?: "morada" | "entrega" | "venda";
}

/** Vista partilhada pelas fases Confirmadas / Em entrega / Entregues. */
export function StageView({ title, description, statuses, emphasis = "morada" }: StageViewProps) {
  const { data: orders, isLoading } = useOrders();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);

  const list = useMemo(() => orders ?? [], [orders]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list
      .filter((o) => statuses.includes(o.status))
      .filter(
        (o) =>
          !q ||
          [o.customer_name, o.phone, o.product_name, o.city, o.neighborhood]
            .join(" ")
            .toLowerCase()
            .includes(q),
      );
  }, [list, statuses, search]);

  const revenue = rows.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <AppShell
      title={title}
      description={`${rows.length} encomendas${emphasis === "venda" ? ` · ${formatMT(revenue)} em receita` : ""}`}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Input
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar cliente, telefone, produto, cidade"
        />

        {isLoading ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Sem encomendas nesta fase.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {rows.map((o) => (
              <Card key={o.id}>
                <CardContent className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      className="text-left text-base font-semibold text-foreground hover:underline"
                      onClick={() => {
                        setSelected(o);
                        setOpen(true);
                      }}
                    >
                      #{o.order_number} {o.customer_name}
                    </button>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <Info label="Produto" value={o.product_name} />
                    <Info label="Quantidade" value={String(o.quantity)} />
                    <Info label="Telefone" value={`+258 ${o.phone}`} />
                    <Info label="Valor a cobrar" value={formatMT(o.total)} />
                    <Info
                      label="Localização"
                      value={`${o.neighborhood}, ${o.city} — ${o.province}`}
                    />
                    {emphasis === "entrega" ? (
                      <Info label="Ponto de referência" value={o.reference_point ?? "—"} />
                    ) : null}
                    {emphasis === "venda" ? (
                      <Info label="Entregue em" value={formatDateTime(o.delivered_at)} />
                    ) : (
                      <Info label="Data" value={formatDateTime(o.created_at)} />
                    )}
                  </div>
                  <a href={telLink(o.phone)} className="block pt-1">
                    <Button size="sm" variant="secondary">
                      <Phone className="size-4" /> Ligar
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
