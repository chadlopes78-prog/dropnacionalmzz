import { Check, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyInvites, useMyUserId, useRespondInvite } from "@/hooks/useInvites";
import { TEAM_ROLES } from "@/lib/domain";

function roleLabel(role: string) {
  return TEAM_ROLES.find((r) => r.value === role)?.label ?? role;
}

/**
 * Caixa de convites do próprio utilizador.
 *
 * Mostra o identificador da conta (para partilhar com o administrador) e os
 * convites pendentes, que podem ser aceites ou rejeitados.
 */
export function InviteInbox({ className }: { className?: string }) {
  const { data: userId } = useMyUserId();
  const { data: invites } = useMyInvites();
  const respond = useRespondInvite();

  if (!userId) return null;

  const pending = (invites ?? []).filter((i) => i.status === "pendente");

  async function copyId() {
    if (!userId) return;
    await navigator.clipboard.writeText(userId);
    toast.success("Identificador copiado!");
  }

  return (
    <Card className={className}>
      <CardContent className="space-y-4">
        <div>
          <h2 className="font-semibold text-foreground">Convites de equipa</h2>
          <p className="text-sm text-muted-foreground">
            Partilhe o seu identificador com o administrador para receber um convite.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
          <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{userId}</code>
          <Button size="sm" variant="secondary" onClick={() => void copyId()}>
            <Copy className="size-4" /> Copiar
          </Button>
        </div>

        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem convites pendentes.</p>
        ) : (
          <div className="space-y-2">
            {pending.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">Convite para a equipa</p>
                  <Badge variant="secondary" className="mt-1">
                    {roleLabel(invite.role)}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={respond.isPending}
                    onClick={() =>
                      respond.mutate(
                        { id: invite.id, accept: true },
                        {
                          onSuccess: () => toast.success("Convite aceite. Acesso activo."),
                          onError: (e: Error) => toast.error(e.message),
                        },
                      )
                    }
                  >
                    <Check className="size-4" /> Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-status-danger"
                    disabled={respond.isPending}
                    onClick={() =>
                      respond.mutate(
                        { id: invite.id, accept: false },
                        {
                          onSuccess: () => toast.success("Convite rejeitado."),
                          onError: (e: Error) => toast.error(e.message),
                        },
                      )
                    }
                  >
                    <X className="size-4" /> Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
