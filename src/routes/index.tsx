import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Truck, PhoneCall, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatMT } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Drop Nacional Moçambique | Encomende e pague na entrega" },
      {
        name: "description",
        content:
          "Encomende produtos originais em Moçambique e pague somente quando receber. Entrega em todas as províncias com confirmação por telefone.",
      },
      { property: "og:title", content: "Drop Nacional Moçambique | Pagamento na entrega" },
      {
        property: "og:description",
        content: "Faça a sua encomenda online e pague apenas quando o produto chegar a si.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoreHome,
});

function StoreHome() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        // A loja pública não tem acesso a custos internos; pedimos só colunas comerciais.
        .select("id, slug, name, image_url, gallery, short_description, price, promo_price, stock, delivery_cost, provinces, cities, delivery_time, active, created_at")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-base font-semibold text-foreground">Drop Nacional</span>
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              Área da equipa
            </Button>
          </Link>
        </div>
      </header>

      <section className="border-b border-border bg-secondary/50">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" aria-hidden /> Pagamento somente na entrega
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Encomende agora e pague apenas quando receber o produto
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            A nossa equipa liga para confirmar os seus dados e combinar a entrega em todo o país.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Package, text: "Faz a encomenda em 1 minuto" },
              { icon: PhoneCall, text: "Confirmamos por telefone" },
              { icon: Truck, text: "Paga na entrega, em mão" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground"
              >
                <Icon className="size-4 text-primary" aria-hidden />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Produtos disponíveis</h2>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        ) : !products?.length ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Ainda não há produtos publicados.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card key={p.id} className="overflow-hidden py-0">
                <div className="aspect-4/3 w-full bg-muted">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      width={600}
                      height={450}
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <CardContent className="space-y-2 p-4">
                  <h3 className="line-clamp-1 font-medium text-foreground">{p.name}</h3>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {p.short_description}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-foreground">
                      {formatMT(p.promo_price ?? p.price)}
                    </span>
                    {p.promo_price ? (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatMT(p.price)}
                      </span>
                    ) : null}
                  </div>
                  <Link to="/checkout/$slug" params={{ slug: p.slug }} className="block pt-1">
                    <Button className="w-full">Encomendar</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
