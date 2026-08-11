import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Clapperboard,
  Compass,
  PenLine,
  Radar,
  Sparkles,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { SupabaseConfigBanner } from "@/components/auth/supabase-banner";
import { useAuth } from "@/lib/auth/auth-context";
import { weeklyReports } from "@/data/weekly-reports";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [{ title: "Dashboard | Community Manager IA" }],
  }),
  component: DashboardPage,
});

const tools = [
  {
    to: "/app/analisis",
    icon: Radar,
    title: "Análisis de perfil",
    text: "Pega el link de una red social y recibe áreas de oportunidad con consejos.",
  },
  {
    to: "/app/estrategia",
    icon: Compass,
    title: "Estrategia de contenido",
    text: "Plan por perfil, red y objetivo, con insights de marketing.",
  },
  {
    to: "/app/calendario",
    icon: CalendarDays,
    title: "Calendario de posts",
    text: "Genera un plan editorial por perfil y por cada red social.",
  },
  {
    to: "/app/copies",
    icon: PenLine,
    title: "Copies de publicaciones",
    text: "Genera variantes de copy por red, tono y objetivo de conversión.",
  },
  {
    to: "/app/scripts",
    icon: Clapperboard,
    title: "Guiones para videos",
    text: "Estructura hooks, escenas, texto en pantalla y CTA para Reels, TikTok o Shorts.",
  },
  {
    to: "/app/reports",
    icon: BarChart3,
    title: "Reportes semanales",
    text: "Revisa el desempeño por red social y el detalle de cada publicación.",
  },
] as const;

function DashboardPage() {
  const { user, users, isAdmin } = useAuth();
  const latest = weeklyReports[0]!;
  const totalReach = latest.networks.reduce((acc, n) => acc + n.reach, 0);
  const avgEng =
    latest.networks.reduce((acc, n) => acc + n.engagementRate, 0) /
    Math.max(latest.networks.length, 1);

  const firstName = user?.name.split(/\s+/)[0] ?? "hola";

  return (
    <AppShell
      title={`Hola, ${firstName}`}
      description={`Dashboard de ${user?.agency ?? "tu agencia"} · ${user?.email ?? ""}`}
    >
      <SupabaseConfigBanner />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Alcance semanal",
            value: new Intl.NumberFormat("es-MX").format(totalReach),
          },
          {
            label: "Engagement promedio",
            value: `${avgEng.toFixed(1)}%`,
          },
          {
            label: "Publicaciones",
            value: String(latest.posts.length),
          },
          {
            label: "Usuarios del equipo",
            value: String(users.length),
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight">{kpi.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/30 px-3 py-1 text-xs font-medium text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Tu semana
            </p>
            <h2 className="mt-3 text-xl font-semibold">Resumen de {latest.weekLabel}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cliente de referencia: {latest.client}. Usa las herramientas para producir y medir.
            </p>
          </div>
          <Link
            to="/app/reports"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-foreground"
          >
            Ver reporte completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          {latest.highlights.map((h) => (
            <li
              key={h}
              className="rounded-2xl bg-surface-2/80 px-4 py-3 text-sm leading-relaxed text-muted-foreground"
            >
              {h}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Herramientas</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/40">
                <tool.icon className="h-5 w-5 text-primary-foreground" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{tool.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tool.text}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary-foreground">
                Abrir
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {isAdmin ? (
        <section className="mt-8 rounded-3xl border border-dashed border-border bg-surface/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/70">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </span>
              <div>
                <h2 className="font-semibold">Gestionar equipo</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Como administrador puedes agregar nuevos usuarios al dashboard.
                </p>
              </div>
            </div>
            <Link
              to="/app/usuarios"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Agregar usuarios
            </Link>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
