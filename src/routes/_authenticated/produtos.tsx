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
import { cn } from "@/lib/utils";

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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <Card key={p.id} className="group overflow-hidden border-border/40 transition-all hover:shadow-md dark:hover:bg-accent/5">
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    Sem imagem
                  </div>
                )}
                <div className="absolute right-2 top-2 flex gap-1">
                  <Badge variant={p.active ? "default" : "secondary"} className="shadow-sm">
                    {p.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="mb-3 space-y-1">
                  <h3 className="line-clamp-1 font-bold text-foreground">{p.name}</h3>
                  <p className="truncate text-[10px] font-mono text-muted-foreground">
                    /checkout/{p.slug}
                  </p>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Venda</span>
                    <p className="font-bold text-foreground">
                      {p.promo_price ? (
                        <span className="flex flex-col">
                          <s className="text-[9px] text-muted-foreground/60">{formatMT(p.price)}</s>
                          <span className="text-primary">{formatMT(p.promo_price)}</span>
                        </span>
                      ) : (
                        formatMT(p.price)
                      )}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Stock</span>
                    <p className={cn(
                      "font-bold",
                      Number(p.stock) <= 5 ? "text-status-danger" : "text-foreground"
                    )}>
                      {p.stock} un.
                    </p>
                  </div>

                  {showCosts && (
                    <div className="col-span-2 mt-1 border-t border-border/40 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Lucro Líquido</span>
                        <span className={cn(
                          "font-black",
                          margin(p) >= 0 ? "text-status-ok" : "text-status-danger"
                        )}>
                          {formatMT(margin(p))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-8 flex-1 text-[11px] font-bold"
                    onClick={() => copyLink(p.slug)}
                  >
                    <Copy className="mr-1 size-3" /> Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 text-[11px] font-bold"
                    onClick={() => {
                      setEditing(p);
                      setForm(toForm(p));
                      setOpen(true);
                    }}
                  >
                    <Pencil className="mr-1 size-3" /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-status-danger hover:bg-status-danger/10 hover:text-status-danger"
                    onClick={() => {
                      if (confirm("Deseja eliminar este produto?")) {
                        remove.mutate(p.id);
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
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
            <section className="space-y-3">
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

              <div className="space-y-1.5">
                <Label className="text-xs">Foto do produto</Label>
                {form.image_url ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                    <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 size-8"
                      onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const fileExt = file.name.split(".").pop();
                        const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
                        const { error, data } = await supabase.storage
                          .from("product-images")
                          .upload(fileName, file);
                        if (error) throw error;
                        const { data: { publicUrl } } = supabase.storage
                          .from("product-images")
                          .getPublicUrl(data.path);
                        setForm((f) => ({ ...f, image_url: publicUrl }));
                        toast.success("Imagem carregada.");
                      } catch (err: any) {
                        toast.error(`Erro: ${err.message}`);
                      }
                    }}
                  />
                )}
              </div>

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
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-t pt-4">Stock</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stock disponível">
                  <Input
                    inputMode="numeric"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="show_stock" className="text-xs">Mostrar aviso de stock no checkout</Label>
                <Switch
                  id="show_stock"
                  checked={form.show_stock_warning}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, show_stock_warning: v }))}
                />
              </div>
              {form.show_stock_warning && (
                <Field label="Mensagem de urgência">
                  <Input
                    value={form.stock_urgency_message}
                    onChange={(e) => setForm((f) => ({ ...f, stock_urgency_message: e.target.value }))}
                  />
                </Field>
              )}
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="continue_selling" className="text-xs">Continuar vendendo sem stock</Label>
                <Switch
                  id="continue_selling"
                  checked={form.continue_selling_no_stock}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, continue_selling_no_stock: v }))}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-t pt-4">Disponibilidade</h3>
              <Field label="Cidades atendidas (separadas por vírgula)">
                <Input
                  value={form.cities}
                  onChange={(e) => setForm((f) => ({ ...f, cities: e.target.value }))}
                  placeholder="Maputo, Matola, Beira"
                />
              </Field>
              <div className="space-y-2">
                <Label className="text-xs">Províncias com entrega</Label>
                <div className="flex flex-wrap gap-2">
                  {PROVINCES.map((prov) => {
                    const on = form.provinces.includes(prov);
                    return (
                      <button
                        key={prov}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            provinces: on
                              ? f.provinces.filter((p) => p !== prov)
                              : [...f.provinces, prov],
                          }))
                        }
                        className={`rounded-full border px-3 py-1 text-[10px] transition ${
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {prov}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Depoimentos</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      testimonials: [
                        ...f.testimonials,
                        { image_url: "", name: "", city: "", text: "" },
                      ],
                    }))
                  }
                >
                  <Plus className="size-3 mr-1" /> Adicionar
                </Button>
              </div>

              <div className="space-y-4">
                {form.testimonials.map((t, i) => (
                  <Card key={i} className="relative overflow-hidden border-dashed">
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                          {t.image_url ? (
                            <img src={t.image_url} className="size-full object-cover" />
                          ) : (
                            <div className="flex size-full items-center justify-center">
                              <User className="size-6 text-muted-foreground/40" />
                            </div>
                          )}
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const fileName = `testimonial-${Math.random().toString(36).slice(2)}`;
                              const { error, data } = await supabase.storage
                                .from("product-images")
                                .upload(fileName, file);
                              if (!error && data) {
                                const { data: { publicUrl } } = supabase.storage
                                  .from("product-images")
                                  .getPublicUrl(data.path);
                                setForm((f) => {
                                  const updated = [...f.testimonials];
                                  const item = updated[i];
                                  if (item) {
                                    updated[i] = { ...item, image_url: publicUrl };
                                  }
                                  return { ...f, testimonials: updated };
                                });
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Nome (opcional)"
                            className="h-8 text-xs"
                            value={t.name}
                            onChange={(e) => {
                              const updated = [...form.testimonials];
                              const item = updated[i];
                              if (item) {
                                updated[i] = { ...item, name: e.target.value };
                                setForm((f) => ({ ...f, testimonials: updated }));
                              }
                            }}
                          />
                          <Input
                            placeholder="Cidade (opcional)"
                            className="h-8 text-xs"
                            value={t.city}
                            onChange={(e) => {
                              const updated = [...form.testimonials];
                              const item = updated[i];
                              if (item) {
                                updated[i] = { ...item, city: e.target.value };
                                setForm((f) => ({ ...f, testimonials: updated }));
                              }
                            }}
                          />
                        </div>
                      </div>
                      <Textarea
                        placeholder="Texto do depoimento..."
                        className="text-xs"
                        rows={2}
                        value={t.text}
                        onChange={(e) => {
                          const updated = [...form.testimonials];
                          const item = updated[i];
                          if (item) {
                            updated[i] = { ...item, text: e.target.value };
                            setForm((f) => ({ ...f, testimonials: updated }));
                          }
                        }}
                      />
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={i === 0}
                          onClick={() => {
                            const updated = [...form.testimonials];
                            const prev = updated[i - 1];
                            const curr = updated[i];
                            if (prev && curr) {
                              updated[i - 1] = curr;
                              updated[i] = prev;
                              setForm((f) => ({ ...f, testimonials: updated }));
                            }
                          }}
                        >
                          <ChevronUp className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={i === form.testimonials.length - 1}
                          onClick={() => {
                            const updated = [...form.testimonials];
                            const next = updated[i + 1];
                            const curr = updated[i];
                            if (next && curr) {
                              updated[i + 1] = curr;
                              updated[i] = next;
                              setForm((f) => ({ ...f, testimonials: updated }));
                            }
                          }}
                        >
                          <ChevronDown className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-status-danger"
                          onClick={() => {
                            const updated = form.testimonials.filter((_, idx) => idx !== i);
                            setForm((f) => ({ ...f, testimonials: updated }));
                          }}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {form.testimonials.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">Sem depoimentos.</p>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-t pt-4">Checkout</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Texto do botão">
                  <Input
                    value={form.action_button_text}
                    onChange={(e) => setForm((f) => ({ ...f, action_button_text: e.target.value }))}
                  />
                </Field>
                <Field label="Cor do botão">
                  <Input
                    type="color"
                    className="h-9 p-1"
                    value={form.action_button_color}
                    onChange={(e) => setForm((f) => ({ ...f, action_button_color: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Min. Cron.">
                  <Input
                    inputMode="numeric"
                    value={form.timer_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, timer_minutes: e.target.value }))}
                  />
                </Field>
                <Field label="Seg. Cron.">
                  <Input
                    inputMode="numeric"
                    value={form.timer_seconds}
                    onChange={(e) => setForm((f) => ({ ...f, timer_seconds: e.target.value }))}
                  />
                </Field>
                <Field label="Cor Cron.">
                  <Input
                    type="color"
                    className="h-9 p-1"
                    value={form.timer_color}
                    onChange={(e) => setForm((f) => ({ ...f, timer_color: e.target.value }))}
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-t pt-4">Atividade recente</h3>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="show_activity" className="text-xs">Mostrar atividade no checkout</Label>
                <Switch
                  id="show_activity"
                  checked={form.show_recent_activity}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, show_recent_activity: v }))}
                />
              </div>
              {form.show_recent_activity && (
                <Field label="Frequência (segundos)">
                  <Input
                    inputMode="numeric"
                    value={form.recent_activity_frequency}
                    onChange={(e) => setForm((f) => ({ ...f, recent_activity_frequency: e.target.value }))}
                  />
                </Field>
              )}
            </section>

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
