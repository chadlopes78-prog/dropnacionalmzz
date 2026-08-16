import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { acesso?: "pendente" } =>
    search["acesso"] === "pendente" ? { acesso: "pendente" } : {},

  head: () => ({
    meta: [
      { title: "Entrar na Dashboard | Drop Nacional Moçambique" },
      {
        name: "description",
        content:
          "Acesso da equipa à dashboard de encomendas com pagamento na entrega em Moçambique.",
      },
      { property: "og:title", content: "Entrar na Dashboard | Drop Nacional" },
      {
        property: "og:description",
        content: "Área reservada à equipa de gestão de encomendas.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { acesso } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Se já existir sessão activa e acesso atribuído, segue para a dashboard.
    if (acesso === "pendente") return;
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard" });
    });
  }, [navigate, acesso]);


  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    void navigate({ to: "/dashboard" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    // Confirmação de e-mail está desactivada: entra directamente após criar conta.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      toast.success("Conta criada. Já pode entrar.");
      return;
    }
    void navigate({ to: "/dashboard" });
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Store className="size-4" aria-hidden />
          </span>
          <span className="text-lg font-semibold text-foreground">Drop Nacional</span>
        </div>

        {acesso === "pendente" ? (
          <>
            <div
              role="alert"
              className="mb-4 rounded-lg border border-status-warn/40 bg-status-warn/10 p-3 text-sm text-foreground"
            >
              A sua conta existe, mas ainda não tem função atribuída na equipa. Peça um convite ao
              administrador e aceite-o abaixo.
            </div>
            <InviteInbox className="mb-4" />
          </>
        ) : null}


        <Card>
          <CardHeader>
            <CardTitle>Área da equipa</CardTitle>
            <CardDescription>Gestão de encomendas com pagamento na entrega.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="entrar">
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="criar">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="entrar">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Palavra-passe</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="criar">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email2">E-mail</Label>
                    <Input
                      id="email2"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">Palavra-passe</Label>
                    <Input
                      id="password2"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
