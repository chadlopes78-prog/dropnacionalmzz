import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
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
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  short_description: "",
  price: "",
  promo_price: "",
  product_cost: "",
  delivery_cost: "0",
  stock: "0",
  delivery_time: "24 a 72 horas",
  image_url: "",
  provinces: [...PROVINCES],
  cities: "",
  active: true,
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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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

          <div className="space-y-3">
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
            <Field label="Endereço do checkout (slug)">
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
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
              <Field label="Custo do produto (MT)">
                <Input
                  inputMode="decimal"
                  value={form.product_cost}
                  onChange={(e) => setForm((f) => ({ ...f, product_cost: e.target.value }))}
                />
              </Field>
              <Field label="Custo de entrega (MT)">
                <Input
                  inputMode="decimal"
                  value={form.delivery_cost}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_cost: e.target.value }))}
                />
              </Field>
              <Field label="Stock disponível">
                <Input
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                />
              </Field>
              <Field label="Tempo de entrega">
                <Input
                  value={form.delivery_time}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_time: e.target.value }))}
                />
              </Field>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Imagem do produto</Label>
              <div className="flex flex-col gap-2">
                {form.image_url ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
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
                  <div className="flex flex-col gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          const fileExt = file.name.split(".").pop();
                          const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
                          const filePath = `${fileName}`;

                          const { error: uploadError, data } = await supabase.storage
                            .from("product-images")
                            .upload(filePath, file);

                          if (uploadError) throw uploadError;

                          const { data: { publicUrl } } = supabase.storage
                            .from("product-images")
                            .getPublicUrl(data.path);

                          setForm((f) => ({ ...f, image_url: publicUrl }));
                          toast.success("Imagem carregada com sucesso.");
                        } catch (err: any) {
                          toast.error(`Erro ao carregar imagem: ${err.message}`);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

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
                      className={`rounded-full border px-3 py-1 text-xs transition ${
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
