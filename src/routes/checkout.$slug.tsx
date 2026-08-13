import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShieldCheck, Truck, Loader2, Timer } from "lucide-react";
import { useEffect } from "react";

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
  phone_secondary: string;
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
  phone_secondary: "",
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
        // A loja pública não tem acesso a custos internos; pedimos só colunas comerciais.
        .select("id, slug, name, image_url, gallery, short_description, price, promo_price, stock, delivery_cost, provinces, cities, delivery_time, active, created_at, action_button_text, action_button_color, timer_minutes, timer_seconds, timer_color, show_stock_warning, stock_urgency_message, continue_selling_no_stock, show_recent_activity, recent_activity_frequency, testimonials")


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
    if (form.phone_secondary && !isValidMozPhone(form.phone_secondary))
      next.phone_secondary = "Número secundário inválido.";
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

    // O identificador é gerado no cliente para podermos abrir o recibo sem
    // precisar de ler a tabela `orders` (o público não tem leitura directa).
    const orderId = crypto.randomUUID();

    // Preço, custo de entrega e total NÃO são enviados: são recalculados na
    // base de dados a partir do produto real, para impedir manipulação.
    const { error } = await supabase.from("orders").insert({
      id: orderId,
      product_id: product.id,
      product_name: product.name,
      quantity,
      customer_name: form.customer_name.trim(),
      phone: digitsOnly(form.phone).replace(/^258/, ""),
      phone_secondary: form.phone_secondary ? digitsOnly(form.phone_secondary).replace(/^258/, "") : null,
      province: form.province,
      city: form.city.trim(),
      neighborhood: form.neighborhood.trim(),
      reference_point: form.reference_point.trim() || null,
      contact_period: form.contact_period || null,
      contact_slot: form.contact_slot || null,
      status: "nova",
    });
    setSubmitting(false);

    if (error) {
      toast.error("Não foi possível registar a encomenda. Tente novamente.");
      return;
    }
    void navigate({ to: "/encomenda/$id", params: { id: orderId } });
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
    <div className="min-h-screen bg-muted/40 pb-[max(7rem,calc(env(safe-area-inset-bottom)+7rem))]">
      <div className="mx-auto max-w-lg px-4 py-5">
        <CountdownTimer product={product} />

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

            {/* Aviso de Stock */}
            {product.show_stock_warning && (
              <div className="space-y-1 rounded-lg border border-status-danger/20 bg-status-danger/5 p-3">
                <p className="flex items-center gap-2 text-sm font-bold text-status-danger">
                  <span className="animate-pulse">🔥</span> Restam apenas {product.stock} unidades disponíveis
                </p>
                {product.stock_urgency_message && (
                  <p className="text-xs text-status-danger/80">{product.stock_urgency_message}</p>
                )}
              </div>
            )}

            {product.delivery_time ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Truck className="size-3.5" aria-hidden /> Prazo de entrega: {product.delivery_time}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Notificação de Atividade Recente */}
        <RecentActivity product={product} />

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

              <Field label="Número de telefone 1" error={errors.phone}>
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

              <Field label="Número de telefone 2 (opcional)" error={errors.phone_secondary}>
                <Input
                  className="h-12"
                  value={form.phone_secondary}
                  inputMode="numeric"
                  type="tel"
                  maxLength={12}
                  onChange={(e) => set("phone_secondary", digitsOnly(e.target.value))}
                  placeholder="8XXXXXXX"
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

          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 p-4 backdrop-blur-md border-t border-border lg:static lg:bg-transparent lg:p-0 lg:border-none pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="submit"
              size="lg"
              className="h-14 w-full text-base font-bold shadow-lg transition-transform active:scale-[0.98]"
              disabled={submitting}
              style={{
                backgroundColor: (product as any).action_button_color || "#0D9488",
                color: "white",
              }}
            >
              {submitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                (product as any).action_button_text || "FINALIZAR ENCOMENDA"
              )}
            </Button>
          </div>

          <p className="pb-2 text-center text-xs text-muted-foreground">
            Não é necessário pagar agora. Sem M-Pesa, e-Mola ou cartão.
          </p>
        </form>

        {/* Depoimentos */}
        {Array.isArray(product.testimonials) && product.testimonials.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="px-2 text-center text-lg font-bold text-foreground">
              Veja o que os nossos clientes dizem
            </h2>
            <TestimonialsCarousel testimonials={product.testimonials as any[]} />
          </div>
        )}

        {/* Informações de confiança */}
        <div className="mt-8 space-y-4 px-2 pb-10">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-status-ok/10 text-status-ok">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Compra 100% Segura</p>
              <p className="text-xs text-muted-foreground">Privacidade e segurança garantidas.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Truck className="size-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Entrega em todo Moçambique</p>
              <p className="text-xs text-muted-foreground">Receba no conforto da sua casa.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialsCarousel({ testimonials }: { testimonials: any[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="relative overflow-hidden px-1">
      <div 
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {testimonials.map((t, i) => (
          <div key={i} className="w-full shrink-0 px-1">
            <Card className="border-none bg-card shadow-sm">
              <CardContent className="p-4 space-y-3">
                {t.image_url && (
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    <img src={t.image_url} className="size-full object-cover" alt="Depoimento" />
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-foreground">{t.name || "Cliente Satisfeito"}</p>
                    <p className="text-[10px] uppercase text-muted-foreground">{t.city}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground italic">"{t.text}"</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      {testimonials.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {testimonials.map((_, i) => (
            <div
              key={i}
              className={cn(
                "size-1.5 rounded-full transition-all",
                i === current ? "w-4 bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const COMMON_NAMES = [
  "João", "Carlos", "Paulo", "José", "Manuel", "António",
  "Maria", "Ana", "Helena", "Carla", "Marta", "Isabel",
  "Francisco", "Ricardo", "Luís", "Fernando", "Beatriz", "Sónia"
];

function RecentActivity({ product }: { product: any }) {
  const [activity, setActivity] = useState<{ name: string; city: string; time: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!product.show_recent_activity) return;

    const showNewActivity = () => {
      const name = COMMON_NAMES[Math.floor(Math.random() * COMMON_NAMES.length)] || "Cliente";
      
      // Lógica de cidades permitidas
      let city = "Moçambique";
      const productCities = Array.isArray(product.cities) ? product.cities : [];
      const productProvinces = Array.isArray(product.provinces) ? product.provinces : [];
      
      if (productCities.length > 0) {
        city = String(productCities[Math.floor(Math.random() * productCities.length)]);
      } else if (productProvinces.length > 0) {
        city = String(productProvinces[Math.floor(Math.random() * productProvinces.length)]);
      } else {
        const allCities = ["Maputo", "Matola", "Beira", "Nampula", "Chimoio", "Tete", "Quelimane", "Pemba"];
        city = allCities[Math.floor(Math.random() * allCities.length)] || "Moçambique";
      }

      const times = ["há poucos segundos", "acabou de encomendar", "há 2 minutos", "há 5 minutos"];
      const time = times[Math.floor(Math.random() * times.length)] || "recentemente";

      setActivity({ name, city, time });
      setVisible(true);

      // Esconder após 5 segundos
      setTimeout(() => setVisible(false), 5000);
    };

    // Primeira atividade após 3s
    const firstTimeout = setTimeout(showNewActivity, 3000);

    const interval = setInterval(showNewActivity, (product.recent_activity_frequency || 30) * 1000);

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, [product]);

  if (!activity) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] left-4 right-4 z-50 transition-all duration-500 lg:bottom-4 lg:left-4 lg:right-auto lg:w-80",
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
      )}
    >
      <div className="flex items-center gap-3 rounded-full border border-border bg-background/95 p-2 pr-4 shadow-xl backdrop-blur-sm">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-4" />
        </div>
        <p className="text-[11px] leading-tight text-foreground">
          <span className="font-bold">{activity.name}</span>, de <span className="font-bold">{activity.city}</span>, {activity.time}.
        </p>
      </div>
    </div>
  );
}

function CountdownTimer({ product }: { product: any }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (product) {
      const minutes = product.timer_minutes ?? 10;
      const seconds = product.timer_seconds ?? 0;
      setTimeLeft(minutes * 60 + seconds);
    }
  }, [product]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  if (timeLeft === null || timeLeft <= 0) return null;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const color = product.timer_color || "#ef4444";

  return (
    <div 
      className="mb-4 flex items-center justify-center gap-2 rounded-lg border py-3 font-black shadow-md animate-pulse"
      style={{ backgroundColor: color, borderColor: color, color: 'white' }}
    >

      <Timer className="size-5" />
      <span>PROMOÇÃO TERMINA EM:</span>
      <span className="tabular-nums">
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
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
