import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  Clapperboard,
  LayoutDashboard,
  LogOut,
  Menu,
  PenLine,
  Radar,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLE_LABELS } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/analisis", label: "Análisis", icon: Radar, exact: false },
  { to: "/app/calendario", label: "Calendario", icon: CalendarDays, exact: false },
  { to: "/app/copies", label: "Copies", icon: PenLine, exact: false },
  { to: "/app/scripts", label: "Guiones", icon: Clapperboard, exact: false },
  { to: "/app/reports", label: "Reportes", icon: BarChart3, exact: false },
  { to: "/app/usuarios", label: "Usuarios", icon: Users, exact: false, adminOnly: true },
] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = nav.filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin);

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-aura pointer-events-none absolute inset-x-0 top-0 h-72" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface p-5 transition-transform md:static md:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-8 flex items-center justify-between">
            <Link to="/app" className="font-display text-lg font-bold tracking-tight">
              Community Manager <span className="text-primary">IA</span>
            </Link>
            <button
              type="button"
              className="rounded-lg p-2 text-muted-foreground md:hidden"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="space-y-1">
            {items.map((item) => {
              const active = item.exact
                ? pathname === item.to || pathname === `${item.to}/`
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/35 text-primary-foreground"
                      : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {user ? (
            <div className="mt-auto space-y-3 border-t border-border pt-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/40 text-sm font-semibold text-primary-foreground">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ROLE_LABELS[user.role]} · {user.agency}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full rounded-full"
                onClick={() => {
                  void (async () => {
                    try {
                      await logout();
                      toast.success("Sesión cerrada");
                      void navigate({ to: "/iniciar-sesion" });
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "No se pudo cerrar sesión",
                      );
                    }
                  })();
                }}
              >
                <LogOut />
                Cerrar sesión
              </Button>
            </div>
          ) : null}
        </aside>

        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-foreground/20 md:hidden"
            aria-label="Cerrar overlay"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/85 px-5 py-4 backdrop-blur">
            <button
              type="button"
              className="rounded-lg border border-border p-2 md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </header>
          <main className="flex-1 px-5 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
