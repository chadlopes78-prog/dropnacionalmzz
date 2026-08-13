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
      { property: "og:title", content: "Drop Nacional Moçambique | Encomende e pague na entrega" },
      {
        property: "og:description",
        content: "Encomende produtos originais em Moçambique e pague somente quando receber. Entrega em todas as províncias com confirmação por telefone.",
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
        .select("id, slug, name, image_url, gallery, short_description, price, promo_price, stock, delivery_cost, provinces, cities, delivery_time, active, created_at, action_button_text, action_button_color")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20">
              <Package className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Drop<span className="text-primary">Nacional</span>
            </span>
          </div>
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="rounded-full font-medium transition-all hover:bg-secondary/80">
              Área da Equipa
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,var(--color-primary)_0%,transparent_100%)] opacity-[0.03]" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm animate-in fade-in slide-in-from-bottom-3 duration-700">
              <ShieldCheck className="size-4" />
              <span>Compra 100% Segura • Pagamento na Entrega</span>
            </div>
            
            <h1 className="mx-auto max-w-4xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl lg:text-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Os melhores produtos chegam até à sua porta
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
              A maior rede de Drop Nacional em Moçambique. Encomende hoje e pague apenas quando o produto estiver nas suas mãos.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <Button size="lg" className="h-12 rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/20" onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver Catálogo
              </Button>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card/50 px-5 py-2 text-sm font-medium backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>+500 Encomendas esta semana</span>
              </div>
            </div>
          </div>

          {/* Value Props Grid */}
          <div className="mt-20 grid gap-6 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
            {[
              { 
                icon: Package, 
                title: "Pedido Rápido", 
                desc: "Preencha os seus dados em menos de 1 minuto sem precisar de cartão." 
              },
              { 
                icon: PhoneCall, 
                title: "Confirmação Humana", 
                desc: "A nossa equipa liga-lhe em instantes para validar e agendar a entrega." 
              },
              { 
                icon: Truck, 
                title: "Pague ao Receber", 
                desc: "O risco é zero. Só paga quando o estafeta entregar o produto em mão." 
              },
            ].map(({ icon: Icon, title, desc }, idx) => (
              <div
                key={title}
                className="group relative flex flex-col items-center rounded-3xl border border-border/50 bg-card/50 p-8 text-center transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 backdrop-blur-sm"
              >
                <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Icon className="size-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="catalogo" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-end justify-between border-b border-border/50 pb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Destaques da Semana</h2>
            <p className="mt-2 text-muted-foreground text-lg">Produtos verificados com entrega imediata em todas as províncias.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : !products?.length ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center py-20 text-center">
              <Package className="mb-4 size-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">Sem produtos disponíveis</h3>
              <p className="mt-1 text-sm text-muted-foreground">Estamos a repor o stock. Volte em breve!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <div 
                key={p.id} 
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-card transition-all hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <Package className="size-12 opacity-20" />
                    </div>
                  )}
                  {p.promo_price && (
                    <div className="absolute top-4 left-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-lg">
                      OFERTA
                    </div>
                  )}
                  <div className="absolute top-4 right-4 rounded-full bg-background/80 px-3 py-1 text-[10px] font-bold tracking-wider text-foreground backdrop-blur-md">
                    ENTREGA GRÁTIS
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-2 flex flex-1 flex-col">
                    <h3 className="text-lg font-bold leading-tight text-foreground line-clamp-2">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {p.short_description}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                    <div className="flex flex-col">
                      {p.promo_price && (
                        <span className="text-xs text-muted-foreground line-through decoration-primary/50">
                          {formatMT(p.price)}
                        </span>
                      )}
                      <span className="text-xl font-black text-primary">
                        {formatMT(p.promo_price ?? p.price)}
                      </span>
                    </div>
                    <Link to="/checkout/$slug" params={{ slug: p.slug }}>
                      <Button 
                        size="sm" 
                        className="rounded-full px-5 font-bold shadow-lg shadow-primary/10 transition-transform active:scale-95"
                        style={{
                          backgroundColor: (p as any).action_button_color || "#0D9488",
                          color: "white"
                        }}
                      >
                        {(p as any).action_button_text || "Encomendar"}
                      </Button>

                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-20 border-t border-border/50 bg-card/30 py-12 backdrop-blur-sm pb-[max(3rem,calc(env(safe-area-inset-bottom)+3rem))]">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/20">
              <Package className="size-4 text-primary" />
            </div>
            <span className="font-bold text-foreground">DropNacional</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            © {new Date().getFullYear()} Drop Nacional Moçambique. Todos os direitos reservados.
          </p>
          <div className="mt-6 flex justify-center gap-8">
            {["Termos", "Privacidade", "Contactos"].map((link) => (
              <a key={link} href="#" className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
