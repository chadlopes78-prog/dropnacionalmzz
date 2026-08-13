import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Pencil, Plus, Trash2, ChevronUp, ChevronDown, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, type Product } from "@/hooks/useOrders";
import { canSeeCosts, useMyRoles } from "@/hooks/useRoles";

import { PROVINCES, formatMT, slugify } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({
    meta: [
      { title: "Gestão de produtos | Drop Nacional" },
      {
        name: "description",
        content:
          "Crie e edite produtos, preços, custos, zonas de entrega e gere o link de checkout.",
      },
      { property: "og:title", content: "Gestão de produtos | Drop Nacional" },
      { property: "og:description", content: "Catálogo e links de checkout de cada produto." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductsPage,
});

interface Testimonial {
  image_url: string;
  name: string;
  city: string;
  text: string;
}

interface FormState {
  name: string;
  slug: string;
  short_description: string;
  price: string;
  promo_price: string;
  product_cost: string;
  delivery_cost: string;
  stock: string;
  delivery_time: string;
  image_url: string;
  provinces: string[];
  cities: string;
  active: boolean;
  action_button_text: string;
  action_button_color: string;
  timer_minutes: string;
  timer_seconds: string;
  timer_color: string;
  // Novas configurações
  show_stock_warning: boolean;
  stock_urgency_message: string;
  continue_selling_no_stock: boolean;
  show_recent_activity: boolean;
  recent_activity_frequency: string;
  testimonials: Testimonial[];
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  short_description: "",
  price: "",
  promo_price: "",
  product_cost: "0",
  delivery_cost: "0",
  stock: "0",
  delivery_time: "24 a 72 horas",
  image_url: "",
  provinces: [...PROVINCES],
  cities: "",
  active: true,
  action_button_text: "Comprar Agora",
  action_button_color: "#0D9488",
  timer_minutes: "10",
  timer_seconds: "0",
  timer_color: "#ef4444",
  show_stock_warning: false,
  stock_urgency_message: "A previsão é que o stock termine ainda hoje.",
  continue_selling_no_stock: false,
  show_recent_activity: false,
  recent_activity_frequency: "30",
  testimonials: [],
};

function toForm(p: Product): FormState {
  return {
    name: p.name,
    slug: p.slug,
    short_description: p.short_description ?? "",
    price: String(p.price),
    promo_price: p.promo_price != null ? String(p.promo_price) : "",
    product_cost: String(p.product_cost),
    delivery_cost: String(p.delivery_cost),
    stock: String(p.stock),
    delivery_time: p.delivery_time ?? "",
    image_url: p.image_url ?? "",
    provinces: p.provinces ?? [],
    cities: (p.cities ?? []).join(", "),
    active: p.active,
    action_button_text: (p as any).action_button_text ?? "Comprar Agora",
    action_button_color: (p as any).action_button_color ?? "#0D9488",
    timer_minutes: String((p as any).timer_minutes ?? 10),
    timer_seconds: String((p as any).timer_seconds ?? 0),
    timer_color: (p as any).timer_color ?? "#ef4444",
    show_stock_warning: (p as any).show_stock_warning ?? false,
    stock_urgency_message: (p as any).stock_urgency_message ?? "A previsão é que o stock termine ainda hoje.",
    continue_selling_no_stock: (p as any).continue_selling_no_stock ?? false,
    show_recent_activity: (p as any).show_recent_activity ?? false,
    recent_activity_frequency: String((p as any).recent_activity_frequency ?? 30),
    testimonials: (p as any).testimonials ?? [],
  };
}



function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const list = useMemo(() => products ?? [], [products]);
  const { data: myRoles } = useMyRoles();
  // Custos e margens só são mostrados a administradores e gestores.
  const showCosts = canSeeCosts(myRoles);


  const save = useMutation({
    mutationFn: async () => {
      const price = Number(form.price);
      const cost = Number(form.product_cost);
      if (!form.name.trim()) throw new Error("O nome do produto é obrigatório.");
      if (!Number.isFinite(price) || price <= 0) throw new Error("Preço inválido.");
      if (!Number.isFinite(cost) || cost < 0) throw new Error("Custo inválido.");

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        short_description: form.short_description.trim() || null,
        price,
        promo_price: form.promo_price ? Number(form.promo_price) : null,
        product_cost: cost,
        delivery_cost: Number(form.delivery_cost) || 0,
        stock: Number(form.stock) || 0,
        delivery_time: form.delivery_time.trim() || null,
        image_url: form.image_url.trim() || null,
        provinces: form.provinces,
        cities: form.cities
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        active: form.active,
        action_button_text: form.action_button_text.trim() || "Comprar Agora",
        action_button_color: form.action_button_color.trim() || "#0D9488",
        timer_minutes: Number(form.timer_minutes) || 0,
        timer_seconds: Number(form.timer_seconds) || 0,
        timer_color: form.timer_color.trim() || "#ef4444",
        show_stock_warning: form.show_stock_warning,
        stock_urgency_message: form.stock_urgency_message,
        continue_selling_no_stock: form.continue_selling_no_stock,
        show_recent_activity: form.show_recent_activity,
        recent_activity_frequency: Number(form.recent_activity_frequency) || 30,
        testimonials: form.testimonials as any,
      };



      const { error } = editing
        ? await supabase.from("products").update(payload).eq("id", editing.id)
        : await supabase.from("products").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editing ? "Produto actualizado." : "Produto criado.");
      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto eliminado.");
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const margin = (p: Product) =>
    Number(p.promo_price ?? p.price) - Number(p.product_cost) - Number(p.delivery_cost);

  function copyLink(slug: string) {
    const url = `${window.location.origin}/checkout/${slug}`;
    void navigator.clipboard.writeText(url);
    toast.success("Link de checkout copiado.");
  }

  return (
    <AppShell title="Produtos" description={`${list.length} produtos no catálogo`}>
      <div className="mb-4">
        <Button
          onClick={() => {
            setEditing(null);
            setForm(EMPTY_FORM);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Novo produto
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Ainda não tem produtos. Crie o primeiro para gerar o link de checkout.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <Card key={p.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">/checkout/{p.slug}</p>
                  </div>
                  <Badge variant={p.active ? "default" : "secondary"}>
                    {p.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>

                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={`Fotografia do produto ${p.name}`}
                    loading="lazy"
                    className="h-32 w-full rounded-lg object-cover"
                  />
                ) : null}

                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Preço</span>
                  <span className="text-right font-medium">
                    {p.promo_price ? (
                      <>
                        <s className="text-muted-foreground">{formatMT(p.price)}</s>{" "}
                        {formatMT(p.promo_price)}
                      </>
                    ) : (
                      formatMT(p.price)
                    )}
                  </span>
                  {showCosts ? (
                    <>
                      <span className="text-muted-foreground">Custo</span>
                      <span className="text-right">{formatMT(p.product_cost)}</span>
                      <span className="text-muted-foreground">Entrega</span>
                      <span className="text-right">{formatMT(p.delivery_cost)}</span>
                      <span className="text-muted-foreground">Margem</span>
                      <span
                        className={`text-right font-semibold ${margin(p) >= 0 ? "text-status-ok" : "text-status-danger"}`}
                      >
                        {formatMT(margin(p))}
                      </span>
                    </>
                  ) : null}

                  <span className="text-muted-foreground">Stock</span>
                  <span className="text-right">{p.stock}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => copyLink(p.slug)}>
                    <Copy className="size-4" /> Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(p);
                      setForm(toForm(p));
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-4" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-status-danger"
                    onClick={() => remove.mutate(p.id)}
                  >
                    <Trash2 className="size-4" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>
              O link de checkout é gerado automaticamente a partir do endereço.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Informações do produto</h3>
              <Field label="Nome do produto">
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: editing ? f.slug : slugify(e.target.value),
                    }))
                  }
                />
              </Field>
              <Field label="Descrição curta">
                <Textarea
                  rows={3}
                  value={form.short_description}
                  onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Preço (MT)">
                  <Input
                    inputMode="decimal"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </Field>
                <Field label="Preço promocional (MT)">
                  <Input
                    inputMode="decimal"
                    value={form.promo_price}
                    onChange={(e) => setForm((f) => ({ ...f, promo_price: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Stock</h3>
              <Field label="Quantidade disponível">
                <Input
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                />
              </Field>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Depoimentos</h3>
              <p className="text-xs text-muted-foreground">Gestão de depoimentos disponível em breve.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Disponibilidade</h3>
              <Field label="Cidades atendidas (separadas por vírgula)">
                <Input
                  value={form.cities}
                  onChange={(e) => setForm((f) => ({ ...f, cities: e.target.value }))}
                  placeholder="Maputo, Matola, Beira"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="active">Produto activo no checkout</Label>
              <Switch
                id="active"
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "A guardar..." : "Guardar produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
