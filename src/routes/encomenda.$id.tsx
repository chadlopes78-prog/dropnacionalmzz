import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, Phone, Package, Truck, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatMT } from "@/lib/domain";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";


export const Route = createFileRoute("/encomenda/$id")({
  head: () => ({
    meta: [
      { title: "Encomenda recebida | Drop Nacional Moçambique" },
      {
        name: "description",
        content:
          "A sua encomenda foi registada. A equipa entrará em contacto para confirmar a entrega.",
      },
      { property: "og:title", content: "Encomenda recebida" },
      { property: "og:description", content: "Pagamento somente na entrega." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderReceipt,
});

function OrderReceipt() {
  const { id } = Route.useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order-receipt", id],
    queryFn: async () => {
      // Função segura da base de dados: devolve apenas o resumo desta encomenda.
      const { data, error } = await supabase.rpc("get_order_receipt", { p_id: id });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-8 pb-[max(4rem,calc(env(safe-area-inset-bottom)+4rem))] pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Topo - Sucesso */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-10 text-primary animate-in zoom-in duration-500" aria-hidden />
          </div>
          <h1 className="text-2xl font-black text-foreground leading-tight px-4">
            Parabéns! A sua encomenda foi recebida com sucesso 🎉
          </h1>
          <div className="space-y-3 text-sm text-muted-foreground px-2">
            <p className="font-medium text-foreground">
              Já recebemos os seus dados e a sua encomenda foi registada.
            </p>
            <p>
              A nossa equipa vai entrar em contacto consigo dentro de alguns minutos ou nas próximas horas para confirmar a sua encomenda e combinar todos os detalhes da entrega.
            </p>
          </div>
        </div>

        {/* Aviso Chamada */}
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
          <p className="flex items-center gap-2 font-bold text-primary">
            <Phone className="size-4" /> Fique atento ao seu telefone
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Vamos ligar para o número que informou no momento da encomenda. Por favor, mantenha o telefone disponível para conseguirmos confirmar a sua encomenda.
          </p>
        </div>

        {/* Resumo da Encomenda */}
        <div className="space-y-3">
          <h2 className="px-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Resumo da sua encomenda
          </h2>
          <Card className="border-none shadow-sm">
            <CardContent className="space-y-2.5 pt-6 text-sm">
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : !order ? (
                <p className="py-4 text-center text-muted-foreground">Encomenda não encontrada.</p>
              ) : (
                <>
                  <Row label="Produto" value={order.product_name} />
                  <Row label="Quantidade" value={String(order.quantity)} />
                  <div className="flex items-center justify-between border-y border-border/50 py-3 my-1 text-base font-bold text-foreground">
                    <span>Total</span>
                    <span className="text-primary">{formatMT(order.total)}</span>
                  </div>
                  <Row label="Nome" value={order.customer_name} />
                  <Row label="Telefone 1" value={order.phone} />
                  {order.phone_secondary && (
                    <Row label="Telefone 2" value={order.phone_secondary} />
                  )}
                  <Row label="Província" value={order.province} />
                  <Row label="Cidade/Distrito" value={order.city} />
                  <Row label="Bairro" value={order.neighborhood} />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pagamento */}
        <div className="rounded-xl border-2 border-status-ok/20 bg-status-ok/5 p-4 space-y-2">
          <p className="flex items-center gap-2 font-bold text-status-ok">
            💵 Pagamento na entrega
          </p>
          <p className="text-sm text-foreground/80">
            Não precisa pagar nada agora. O pagamento será feito somente quando receber a sua encomenda.
          </p>
        </div>

        {/* Próximos Passos */}
        <div className="space-y-4 pt-2">
          <h2 className="px-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            O que acontece agora?
          </h2>
          <div className="space-y-4">
            <Step 
              number="1" 
              title="Encomenda recebida ✓" 
              desc="Os seus dados já foram enviados para a nossa equipa." 
            />
            <Step 
              number="2" 
              icon={<Phone className="size-3.5" />} 
              title="Confirmação por telefone" 
              desc="Vamos entrar em contacto consigo dentro de alguns minutos ou nas próximas horas." 
            />
            <Step 
              number="3" 
              icon={<Package className="size-3.5" />} 
              title="Preparação da encomenda" 
              desc="Depois da confirmação, a sua encomenda será preparada." 
            />
            <Step 
              number="4" 
              icon={<Truck className="size-3.5" />} 
              title="Entrega" 
              desc="Recebe a encomenda no local combinado e faz o pagamento no momento da entrega." 
            />
          </div>
        </div>

        {/* Aviso Importante Final */}
        <div className="pt-6 space-y-2 text-center border-t border-border/50">
          <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Info className="size-3" /> Importante
          </p>
          <p className="text-sm text-muted-foreground px-4 italic">
            A confirmação por telefone é necessária para avançarmos com a sua encomenda. Fique atento às nossas chamadas.
          </p>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, desc, icon }: { number: string, title: string, desc: string, icon?: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
        {icon || number}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-0.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}

