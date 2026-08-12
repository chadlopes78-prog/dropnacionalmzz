import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrders, useTeam } from "@/hooks/useOrders";
import { useAllRoles, useMyRoles, type AppRole } from "@/hooks/useRoles";
import { TEAM_ROLES, formatMT } from "@/lib/domain";


export const Route = createFileRoute("/_authenticated/equipa")({
  head: () => ({
    meta: [
      { title: "Equipa e desempenho | Drop Nacional" },
      {
        name: "description",
        content:
          "Gerir operadores, gestores e entregadores e acompanhar o desempenho de cada membro.",
      },
      { property: "og:title", content: "Equipa e desempenho | Drop Nacional" },
      { property: "og:description", content: "Membros da equipa e resultados por responsável." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { data: team, isLoading } = useTeam();
  const { data: orders } = useOrders();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>(TEAM_ROLES[1].value);

  const members = useMemo(() => team ?? [], [team]);
  const list = useMemo(() => orders ?? [], [orders]);

  const performance = useMemo(() => {
    return members.map((m) => {
      const mine = list.filter((o) => o.assignee === m.name);
      const delivered = mine.filter((o) => o.status === "entregue");
      const confirmed = mine.filter((o) =>
        ["confirmada", "preparacao", "em_entrega", "entregue"].includes(o.status),
      );
      return {
        id: m.id,
        name: m.name,
        role: m.role,
        active: m.active,
        total: mine.length,
        confirmed: confirmed.length,
        delivered: delivered.length,
        revenue: delivered.reduce((s, o) => s + Number(o.total), 0),
        rate: mine.length ? (confirmed.length / mine.length) * 100 : 0,
      };
    });
  }, [members, list]);

  const add = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Indique o nome do membro.");
      const { error } = await supabase.from("team_members").insert({ name: name.trim(), role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro adicionado.");
      setName("");
      void qc.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("team_members").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["team"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro removido.");
      void qc.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Equipa" description={`${members.length} membros registados`}>
      <AccessControlCard />

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Nome do membro</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Ana Cossa" />
          </div>
          <div className="w-full space-y-1.5 sm:w-56">
            <Label className="text-xs">Função</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => add.mutate()} disabled={add.isPending}>
            <Plus className="size-4" /> Adicionar
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : performance.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Ainda não há membros na equipa.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {performance.map((m) => (
            <Card key={m.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{m.name}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {TEAM_ROLES.find((r) => r.value === m.role)?.label ?? m.role}
                    </Badge>
                  </div>
                  <Switch
                    checked={m.active}
                    onCheckedChange={(v) => toggle.mutate({ id: m.id, active: v })}
                    aria-label={`Activar ${m.name}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Encomendas</span>
                  <span className="text-right">{m.total}</span>
                  <span className="text-muted-foreground">Confirmadas</span>
                  <span className="text-right">{m.confirmed}</span>
                  <span className="text-muted-foreground">Entregues</span>
                  <span className="text-right">{m.delivered}</span>
                  <span className="text-muted-foreground">Taxa de confirmação</span>
                  <span className="text-right">{m.rate.toFixed(1)}%</span>
                  <span className="text-muted-foreground">Receita entregue</span>
                  <span className="text-right font-semibold text-status-ok">
                    {formatMT(m.revenue)}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-status-danger"
                  onClick={() => remove.mutate(m.id)}
                >
                  <Trash2 className="size-4" /> Remover
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
