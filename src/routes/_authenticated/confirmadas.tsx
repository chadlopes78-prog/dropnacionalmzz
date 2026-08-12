import { createFileRoute } from "@tanstack/react-router";
import { StageView } from "@/components/orders/StageView";

export const Route = createFileRoute("/_authenticated/confirmadas")({
  head: () => ({
    meta: [
      { title: "Encomendas confirmadas | Drop Nacional" },
      {
        name: "description",
        content: "Encomendas já confirmadas por telefone e prontas para preparação e envio.",
      },
      { property: "og:title", content: "Encomendas confirmadas | Drop Nacional" },
      { property: "og:description", content: "Fila de preparação de encomendas confirmadas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <StageView
      title="Confirmadas"
      description="Encomendas confirmadas por telefone. Ainda não contam como receita — o cliente paga na entrega."
      statuses={["confirmada", "preparacao"]}
    />
  ),
});
