import { Link, Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SupabaseConfigBanner } from "@/components/auth/supabase-banner";
import { useAuth } from "@/lib/auth/auth-context";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready, configured } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="rounded-3xl border border-border bg-card px-8 py-6 text-sm text-muted-foreground shadow-sm">
          Cargando tu sesión…
        </div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <SupabaseConfigBanner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/iniciar-sesion" search={{ redirect: "/app" }} replace />;
  }

  return children;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, ready, configured } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="rounded-3xl border border-border bg-card px-8 py-6 text-sm text-muted-foreground shadow-sm">
          Cargando…
        </div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <SupabaseConfigBanner />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return children;
}

export function AuthPageFrame({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="hero-aura pointer-events-none absolute inset-x-0 top-0 h-80" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
        <Link to="/" className="mb-8 font-display text-lg font-bold tracking-tight">
          Community Manager <span className="text-primary">IA</span>
        </Link>
        <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}
