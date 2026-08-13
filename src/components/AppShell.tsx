import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  CheckCircle2,
  Truck,
  PackageCheck,
  Boxes,
  UsersRound,
  Menu,
  LogOut,
  Store,
  Check,
  XCircle,
  BarChart3,
  Settings,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAVIGATION_GROUPS = [
  {
    title: "PRINCIPAL",
    items: [
      { to: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
      { to: "/produtos", label: "Produtos", icon: Boxes },
      { to: "/contactos", label: "Contactos", icon: Phone },
    ],
  },
  {
    title: "ENCOMENDAS",
    items: [
      { to: "/por-ligar", label: "Por Ligar", icon: PhoneCall },
      { to: "/confirmadas", label: "Confirmadas", icon: Check },
      { to: "/em-entrega", label: "Em Entrega", icon: Truck },
      { to: "/entregues", label: "Entregues", icon: CheckCircle2 },
      { to: "/canceladas", label: "Canceladas", icon: XCircle },
    ],
  },
  {
    title: "ANÁLISE",
    items: [
      { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
    ],
  },
  {
    title: "GESTÃO",
    items: [
      { to: "/equipa", label: "Equipa", icon: UsersRound },
      { to: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-5 p-3">
      {NAVIGATION_GROUPS.map((group) => (
        <div key={group.title} className="space-y-1">
          <h4 className="px-3 text-[10px] font-bold tracking-wider text-sidebar-foreground/40 uppercase">
            {group.title}
          </h4>
          <div className="flex flex-col gap-0.5">
            {group.items.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className: "bg-sidebar-accent text-sidebar-accent-foreground",
                }}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
      <span className="grid size-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Store className="size-4" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-sidebar-foreground">Drop Nacional</p>
        <p className="text-[11px] text-sidebar-foreground/60">Pagamento na entrega</p>
      </div>
    </div>
  );
}

export interface AppShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, description, actions, children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <NavList />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" aria-hidden /> Terminar sessão
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/85 px-4 py-3 backdrop-blur md:px-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navegação</SheetTitle>
              <Brand />
              <NavList onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-foreground md:text-lg">{title}</h1>
            {description ? (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </header>
        <main className={cn("px-4 py-5 md:px-6 md:py-6 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+1.25rem))]")}>{children}</main>
      </div>
    </div>
  );
}
