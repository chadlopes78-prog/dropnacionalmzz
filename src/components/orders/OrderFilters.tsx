import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROVINCES, STATUSES } from "@/lib/domain";
import type { Order } from "@/hooks/useOrders";

export type PeriodFilter = "todos" | "hoje" | "ontem" | "7dias" | "30dias";

export interface FiltersState {
  search: string;
  period: PeriodFilter;
  product: string;
  province: string;
  city: string;
  status: string;
  assignee: string;
}

export const EMPTY_FILTERS: FiltersState = {
  search: "",
  period: "todos",
  product: "todos",
  province: "todas",
  city: "todas",
  status: "todos",
  assignee: "todos",
};

const ALL = "todos";

function inPeriod(created: string, period: PeriodFilter): boolean {
  if (period === "todos") return true;
  const date = new Date(created);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === "hoje") return date >= start;
  if (period === "ontem") {
    const yesterday = new Date(start);
    yesterday.setDate(yesterday.getDate() - 1);
    return date >= yesterday && date < start;
  }
  const days = period === "7dias" ? 7 : 30;
  const from = new Date(start);
  from.setDate(from.getDate() - days);
  return date >= from;
}

/** Aplica pesquisa livre e filtros a uma lista de encomendas. */
export function applyFilters(orders: Order[], f: FiltersState): Order[] {
  const q = f.search.trim().toLowerCase();
  return orders.filter((o) => {
    if (
      q &&
      ![o.customer_name, o.phone, o.product_name, o.city, o.neighborhood]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
      return false;
    if (!inPeriod(o.created_at, f.period)) return false;
    if (f.product !== ALL && o.product_name !== f.product) return false;
    if (f.province !== "todas" && o.province !== f.province) return false;
    if (f.city !== "todas" && o.city !== f.city) return false;
    if (f.status !== ALL && o.status !== f.status) return false;
    if (f.assignee !== ALL && (o.assignee ?? "") !== f.assignee) return false;
    return true;
  });
}

export interface OrderFiltersProps {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  products: string[];
  cities: string[];
  assignees: string[];
  showStatus?: boolean;
}

export function OrderFilters({
  value,
  onChange,
  products,
  cities,
  assignees,
  showStatus = true,
}: OrderFiltersProps) {
  const set = (patch: Partial<FiltersState>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      {/* Barra de Pesquisa Principal */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={value.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Pesquisar contacto (nome, número, província, cidade, bairro, produto)"
          className="h-11 pl-10"
        />
      </div>

      {/* Filtros Rápidos (Chips) */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Todos", value: "todos" },
          { label: "Novos", value: "nova" },
          { label: "Por ligar", value: "por_ligar" },
          { label: "Confirmados", value: "confirmada" },
          { label: "Em entrega", value: "em_entrega" },
          { label: "Entregues", value: "entregue" },
          { label: "Cancelados", value: "cancelada" },
        ].map((s) => {
          const isActive = value.status === s.value;
          return (
            <button
              key={s.label + s.value}
              onClick={() => set({ status: s.value })}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s.label.toUpperCase()}
            </button>
          );
        })}
      </div>


      {/* Filtros Dropdown */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={value.province} onValueChange={(v) => set({ province: v })}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Província" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as províncias</SelectItem>
            {PROVINCES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.product} onValueChange={(v) => set({ product: v })}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os produtos</SelectItem>
            {products.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.period} onValueChange={(v) => set({ period: v as PeriodFilter })}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Data" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo o período</SelectItem>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="ontem">Ontem</SelectItem>
            <SelectItem value="7dias">Últimos 7 dias</SelectItem>
            <SelectItem value="30dias">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>

        <Select value={value.assignee} onValueChange={(v) => set({ assignee: v })}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os responsáveis</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

  );
}
