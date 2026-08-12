import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShieldCheck, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CONTACT_PERIODS,
  PROVINCES,
  TIME_SLOTS,
  formatMT,
  isValidMozPhone,
  digitsOnly,
} from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout/$slug")({
  head: () => ({
    meta: [
      { title: "Finalizar encomenda | Pagamento na entrega" },
      {
        name: "description",
        content:
          "Preencha os seus dados para receber o produto em casa. Só paga quando receber a encomenda.",
      },
      { property: "og:title", content: "Finalizar encomenda | Pagamento na entrega" },
      {
        property: "og:description",
        content: "Encomende agora e pague somente na entrega, em qualquer província.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

interface FormState {
  customer_name: string;
  phone: string;
  province: string;
  city: string;
  neighborhood: string;
  reference_point: string;
  contact_period: string;
  contact_slot: string;
}

const EMPTY_FORM: FormState = {
  customer_name: "",
  phone: "",
  province: "",
  city: "",
  neighborhood: "",
  reference_point: "",
  contact_period: "",
  contact_slot: "",
};

function CheckoutPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["checkout-product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const unitPrice = Number(product?.promo_price ?? product?.price ?? 0);
  const deliveryCost = Number(product?.delivery_cost ?? 0);
  const total = useMemo(
    () => unitPrice * quantity + deliveryCost,
    [unitPrice, quantity, deliveryCost],
  );

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.customer_name.trim().length < 3) next.customer_name = "Indique o seu nome completo.";
    if (!isValidMozPhone(form.phone))
      next.phone = "Número inválido. Use 84, 85, 86 ou 87 seguido de 7 dígitos.";
    if (!form.province) next.province = "Escolha a província.";
    if (!form.city.trim()) next.city = "Indique a cidade ou distrito.";
    if (!form.neighborhood.trim()) next.neighborhood = "Indique o bairro.";
    if (!form.contact_period && !form.contact_slot)
      next.contact_period = "Escolha o melhor horário para contacto.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    if (!validate()) {
      toast.error("Verifique os campos assinalados.");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("orders")
      .insert({
        product_id: product.id,
        product_name: product.name,
        unit_price: unitPrice,
        quantity,
        delivery_cost: deliveryCost,
        total,
        customer_name: form.customer_name.trim(),
        phone: digitsOnly(form.phone).replace(/^258/, ""),
        province: form.province,
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim(),
        reference_point: form.reference_point.trim() || null,
        contact_period: form.contact_period || null,
        contact_slot: form.contact_slot || null,
        status: "nova",
      })
      .select("id")
      .single();
    setSubmitting(false);

    if (error || !data) {
      toast.error("Não foi possível registar a encomenda. Tente novamente.");
      return;
    }
    void navigate({ to: "/encomenda/$id", params: { id: data.id } });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Produto indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este link de encomenda não está activo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 pb-28">
      <div className="mx-auto max-w-lg px-4 py-5">
        {/* Produto */}
        <Card className="overflow-hidden py-0">
          <div className="aspect-4/3 w-full bg-muted">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                width={800}
                height={600}
                className="size-full object-cover"
              />
            ) : null}
          </div>
          <CardContent className="space-y-3 p-4">
            <h1 className="text-lg font-semibold text-foreground">{product.name}</h1>
            {product.short_description ? (
              <p className="text-sm text-muted-foreground">{product.short_description}</p>
            ) : null}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-foreground">{formatMT(unitPrice)}</span>
              {product.promo_price ? (
                <span className="text-sm text-muted-foreground line-through">
                  {formatMT(product.price)}
                </span>
              ) : null}
            </div>
            <div className="rounded-lg border border-primary/25 bg-primary/8 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                <ShieldCheck className="size-4" aria-hidden /> PAGAMENTO NA ENTREGA
              </p>
              <p className="mt-1 text-sm text-foreground">Só paga quando receber o produto.</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Faça a sua encomenda agora. A nossa equipa entrará em contacto consigo para confirmar
              os dados e combinar a entrega.
            </p>
            {product.delivery_time ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Truck className="size-3.5" aria-hidden /> Prazo de entrega: {product.delivery_time}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Formulário */}
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-sm font-semibold text-foreground">Os seus dados</h2>

              <Field label="Nome completo" error={errors.customer_name}>
                <Input
                  className="h-12"
                  value={form.customer_name}
                  onChange={(e) => set("customer_name", e.target.value)}
                  placeholder="Ex.: João Macuácua"
                  autoComplete="name"
                />
              </Field>

              <Field label="Número de telefone" error={errors.phone}>
                <Input
                  className="h-12"
                  value={form.phone}
                  inputMode="numeric"
                  type="tel"
                  maxLength={12}
                  autoComplete="tel"
                  onChange={(e) => set("phone", digitsOnly(e.target.value))}
                  placeholder="84XXXXXXX"
                />
              </Field>

              <Field label="Província" error={errors.province}>
                <Select value={form.province} onValueChange={(v) => set("province", v)}>
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Escolha a província" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Cidade / Distrito" error={errors.city}>
                <Input
                  className="h-12"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Ex.: Matola"
                />
              </Field>

              <Field label="Bairro" error={errors.neighborhood}>
                <Input
                  className="h-12"
                  value={form.neighborhood}
                  onChange={(e) => set("neighborhood", e.target.value)}
                  placeholder="Ex.: Fomento"
                />
              </Field>

              <Field label="Ponto de referência">
                <Textarea
                  value={form.reference_point}
                  onChange={(e) => set("reference_point", e.target.value)}
                  placeholder="Próximo da Shoprite, escola, mercado, bomba, etc."
                  rows={2}
                />
              </Field>

              <Field label="Quantidade">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-12"
                    aria-label="Diminuir quantidade"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-10 text-center text-lg font-semibold">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-12"
                    aria-label="Aumentar quantidade"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-sm font-semibold text-foreground">
                Qual é o melhor horário para entrarmos em contacto consigo?
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {CONTACT_PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("contact_period", form.contact_period === p ? "" : p)}
                    className={cn(
                      "h-12 rounded-lg border text-sm font-medium transition-colors",
                      form.contact_period === p
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:bg-accent",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <Field label="Horário específico (opcional)" error={errors.contact_period}>
                <Select value={form.contact_slot} onValueChange={(v) => set("contact_slot", v)}>
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Escolher intervalo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 pt-6 text-sm">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Resumo da encomenda</h2>
              <Row label="Produto" value={product.name} />
              <Row label="Quantidade" value={String(quantity)} />
              <Row label="Preço unitário" value={formatMT(unitPrice)} />
              <Row label="Custo de entrega" value={formatMT(deliveryCost)} />
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatMT(total)}</span>
              </div>
              <p className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                Pagamento: Na entrega
              </p>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={submitting}>
            {submitting ? <Loader2 className="size-5 animate-spin" /> : "FINALIZAR ENCOMENDA"}
          </Button>
          <p className="pb-2 text-center text-xs text-muted-foreground">
            Não é necessário pagar agora. Sem M-Pesa, e-Mola ou cartão.
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
