import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatMT } from "@/lib/domain";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-muted/40 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="text-center">
          <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden />
          <h1 className="mt-3 text-xl font-semibold text-foreground">
            Encomenda recebida com sucesso ✅
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Obrigado pela sua encomenda. A nossa equipa irá entrar em contacto consigo através do
            número informado para confirmar os dados e combinar a entrega.
          </p>
        </div>

        <Card className="mt-6">
          <CardContent className="space-y-2 pt-6 text-sm">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : !order ? (
              <p className="text-center text-muted-foreground">Encomenda não encontrada.</p>
            ) : (
              <>
                <Row label="Nº da encomenda" value={`#${order.order_number}`} />
                <Row label="Produto" value={order.product_name} />
                <Row label="Quantidade" value={String(order.quantity)} />
                <Row label="Entrega" value={formatMT(order.delivery_cost)} />
                <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatMT(order.total)}</span>
                </div>
                <Row
                  label="Localização"
                  value={`${order.neighborhood}, ${order.city} — ${order.province}`}
                />
                <Row label="Telefone" value={`+258 ${order.phone}`} />
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 font-medium text-primary">
                  <ShieldCheck className="size-4" aria-hidden /> Pagamento somente na entrega.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Link to="/" className="mt-4 block">
          <Button variant="outline" className="w-full">
            Voltar à loja
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
