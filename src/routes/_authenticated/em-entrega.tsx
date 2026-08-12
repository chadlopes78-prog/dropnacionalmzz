import { createFileRoute } from "@tanstack/react-router";
import { StageView } from "@/components/orders/StageView";

export const Route = createFileRoute("/_authenticated/em-entrega")({
  head: () => ({
    meta: [
      { title: "Encomendas em entrega | Drop Nacional" },
      {
        name: "description",
        content: "Encomendas que já saíram para entrega, com localização e valor a cobrar.",
      },
      { property: "og:title", content: "Encomendas em entrega | Drop Nacional" },
      { property: "og:description", content: "Acompanhe as entregas em curso." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <StageView
      title="Em entrega"
      description="Encomendas já a caminho do cliente. O valor é cobrado no momento da entrega."
      statuses={["em_entrega"]}
      emphasis="entrega"
    />
  ),
});
