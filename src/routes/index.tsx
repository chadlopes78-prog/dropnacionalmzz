import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Truck, PhoneCall, Package, CheckCircle2, TrendingUp, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Drop Nacional Moçambique | A Maior Rede de Dropshipping" },
      {
        name: "description",
        content:
          "A plataforma líder para vender produtos físicos em Moçambique sem stock. Pagamento na entrega, logística integrada e confirmação humana.",
      },
      { property: "og:title", content: "Drop Nacional Moçambique | A Maior Rede de Dropshipping" },
      {
        property: "og:description",
        content: "Venda produtos em Moçambique com risco zero. Logística completa com pagamento na entrega e confirmação por telefone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoreHome,
});

function StoreHome() {
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
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#como-funciona" className="transition-colors hover:text-primary">Como Funciona</a>
            <a href="#beneficios" className="transition-colors hover:text-primary">Benefícios</a>
            <a href="#estatisticas" className="transition-colors hover:text-primary">Estatísticas</a>
          </div>
          <Link to="/auth">
            <Button size="sm" className="rounded-full font-bold shadow-lg shadow-primary/20 px-6">
              Entrar na Plataforma
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-20 pb-24 lg:pt-32 lg:pb-40">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-aurora" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-subtle opacity-70" />
        <div className="pointer-events-none absolute left-1/2 top-[-10rem] -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[160px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary shadow-glow animate-in fade-in slide-in-from-bottom-2 duration-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              Líder em E-commerce Nacional
            </div>

            <h1 className="mx-auto mt-8 max-w-4xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-7xl lg:text-8xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 leading-[1.1]">
              Venda em Moçambique com <span className="text-gradient-primary">Risco Zero</span>
            </h1>

            
            <p className="mx-auto mt-8 max-w-2xl text-xl text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
              A infraestrutura completa para o seu negócio de Drop Nacional. Nós tratamos da importação, confirmação e entrega. Você só precisa de vender.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <Link to="/auth">
                <Button size="lg" className="h-14 w-full sm:w-auto rounded-full px-10 text-lg font-bold shadow-elegant transition-transform hover:scale-105 active:scale-95">
                  Começar a Vender Agora
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 w-full sm:w-auto rounded-full px-10 text-lg font-bold border-2 border-primary/20 bg-background/60 backdrop-blur-md transition-all hover:bg-primary/5" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>

                Ver Como Funciona
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section id="estatisticas" className="border-y border-border/50 bg-card/30 py-12 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Encomendas Entregues", value: "+50.000", icon: CheckCircle2 },
              { label: "Vendedores Ativos", value: "+1.200", icon: Users },
              { label: "Cidades Cobertas", value: "Todas", icon: Globe },
              { label: "Taxa de Sucesso", value: "94%", icon: TrendingUp },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="size-5" />
                </div>
                <div className="text-2xl font-black text-foreground">{stat.value}</div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">Simples, Rápido e Eficiente</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              O ecossistema perfeito para escalar o seu negócio de vendas online em Moçambique.
            </p>
          </div>

          <div className="mt-20 grid gap-12 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Escolha o Produto",
                desc: "Aceda ao nosso catálogo de produtos vencedores já testados no mercado nacional com stock local.",
                icon: Package
              },
              {
                step: "02",
                title: "Venda Online",
                desc: "Use os nossos links de checkout otimizados para converter no Facebook, Instagram ou TikTok.",
                icon: PhoneCall
              },
              {
                step: "03",
                title: "Nós Entregamos",
                desc: "A nossa equipa confirma a encomenda por telefone e entrega ao cliente. Você recebe o seu lucro.",
                icon: Truck
              }
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="mb-8 flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="size-10" />
                  <span className="absolute -top-4 -right-4 text-4xl font-black text-foreground/5">{item.step}</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">{item.title}</h3>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="relative bg-card/50 py-24 lg:py-32 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 size-[500px] rounded-full bg-primary/5 blur-[120px]" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">Porquê escolher o Drop Nacional?</h2>
              <div className="mt-10 space-y-8">
                {[
                  {
                    title: "Pagamento na Entrega",
                    desc: "Aumente as suas vendas em 300%. Em Moçambique, a confiança está no pagamento físico."
                  },
                  {
                    title: "Logística Própria",
                    desc: "Estafetas em todas as capitais provinciais garantindo entregas rápidas e seguras."
                  },
                  {
                    title: "Call Center Dedicado",
                    desc: "Confirmamos cada pedido para garantir que não perde dinheiro com devoluções."
                  }
                ].map((benefit, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-foreground">{benefit.title}</h4>
                      <p className="mt-2 text-muted-foreground leading-relaxed">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative rounded-3xl border border-border/50 bg-background/50 p-8 shadow-2xl backdrop-blur-md">
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-2xl bg-primary/5 p-4 border border-primary/10">
                  <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">12k</div>
                  <div>
                    <div className="text-sm font-bold">Vendas este mês</div>
                    <div className="text-xs text-muted-foreground">+24% em relação ao mês anterior</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-card p-4 border border-border/50">
                    <div className="text-xs font-medium text-muted-foreground uppercase">Lucro Gerado</div>
                    <div className="text-xl font-black mt-1 text-primary">850.000 MT</div>
                  </div>
                  <div className="rounded-2xl bg-card p-4 border border-border/50">
                    <div className="text-xs font-medium text-muted-foreground uppercase">Eficiência</div>
                    <div className="text-xl font-black mt-1 text-primary">98.2%</div>
                  </div>
                </div>
                <div className="pt-4">
                   <Link to="/auth">
                    <Button className="w-full h-12 rounded-xl font-bold">Criar Minha Conta Grátis</Button>
                   </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 py-20 backdrop-blur-sm pb-[max(3rem,calc(env(safe-area-inset-bottom)+3rem))]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20">
                  <Package className="size-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold tracking-tight text-foreground">
                  Drop<span className="text-primary">Nacional</span>
                </span>
              </div>
              <p className="mt-6 max-w-sm text-lg text-muted-foreground leading-relaxed">
                A revolucionar o comércio eletrónico em Moçambique através da melhor rede de logística e confiança.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Plataforma</h4>
              <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
                <li><a href="#como-funciona" className="transition-colors hover:text-primary">Como Funciona</a></li>
                <li><a href="#beneficios" className="transition-colors hover:text-primary">Benefícios</a></li>
                <li><Link to="/auth" className="transition-colors hover:text-primary">Área de Lojista</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Suporte</h4>
              <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="transition-colors hover:text-primary">Termos de Uso</a></li>
                <li><a href="#" className="transition-colors hover:text-primary">Privacidade</a></li>
                <li><a href="#" className="transition-colors hover:text-primary">Contactos</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-20 border-t border-border/50 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Drop Nacional Moçambique. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

