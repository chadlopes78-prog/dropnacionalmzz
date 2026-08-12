import { createFileRoute } from "@tanstack/react-router";
import { StageView } from "@/components/orders/StageView";

export const Route = createFileRoute("/_authenticated/entregues")({
  head: () => ({
    meta: [
      { title: "Encomendas entregues | Vendas realizadas" },
      {
        name: "description",
        content: "Encomendas entregues e pagas. Só estas contam como venda e receita.",
      },
      { property: "og:title", content: "Encomendas entregues | Vendas realizadas" },
      { property: "og:description", content: "Receita realizada com pagamento na entrega." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <StageView
      title="Entregues"
      description="Encomendas entregues e pagas pelo cliente. É aqui que a venda é aprovada e entra na receita."
      statuses={["entregue"]}
      emphasis="venda"
    />
  ),
});
