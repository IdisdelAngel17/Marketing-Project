import { Link } from "@tanstack/react-router";
import { Database } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";

export function SupabaseConfigBanner() {
  const { configured, configError } = useAuth();

  if (configured) return null;

  return (
    <div className="mb-6 rounded-3xl border border-accent/50 bg-accent/30 px-5 py-4 text-sm">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" />
        <div>
          <p className="font-semibold text-foreground">Supabase pendiente de configurar</p>
          <p className="mt-1 text-muted-foreground">
            {configError || "Completa las variables de entorno."} Abre{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 text-xs">.env</code> y pega tu{" "}
            <strong>Publishable key</strong> desde Supabase → Connect. Luego reinicia{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 text-xs">npm run dev</code>.
          </p>
          <p className="mt-2 text-muted-foreground">
            También ejecuta el SQL de{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 text-xs">
              supabase/migrations/001_profiles.sql
            </code>{" "}
            en el SQL Editor.
          </p>
          <Link
            to="/"
            className="mt-3 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
