import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  Clapperboard,
  Compass,
  Film,
  Mail,
  PenLine,
  Radar,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { SupabaseConfigBanner } from "@/components/auth/supabase-banner";
import { useAuth } from "@/lib/auth/auth-context";
import { listClients } from "@/lib/crm/store";
import type { Client } from "@/lib/crm/types";
import { listLeads } from "@/lib/leads/store";
import { weeklyReports } from "@/data/weekly-reports";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [{ title: "Dashboard | Community Manager IA" }],
  }),
  component: DashboardPage,
});

const tools = [
  {
    to: "/app/clientes",
    icon: Building2,
    title: "CRM de clientes",
    text: "Ficha completa: redes, análisis, estrategia, calendario, copies, guiones y reportes.",
  },
  {
    to: "/app/leads",
    icon: Target,
    title: "Leads",
    text: "Inbox de solicitudes de la landing. Contacta y convierte a cliente.",
  },
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
    to: "/app/editor",
    icon: Film,
    title: "Editor de video",
    text: "Sube un clip, subtitúlalo, aplica zooms y recibe feedback del corte final.",
  },
  {
    to: "/app/reports",
    icon: BarChart3,
    title: "Reportes semanales",
    text: "Revisa el desempeño por red social y el detalle de cada publicación.",
  },
  {
    to: "/app/correos",
    icon: Mail,
    title: "Correos con Resend",
    text: "Escribe a clientes o al equipo con plantillas y historial por ficha CRM.",
  },
] as const;

function DashboardPage() {
  const { user, users, isAdmin } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [newLeads, setNewLeads] = useState(0);
  const latest = weeklyReports[0]!;
  const totalReach = latest.networks.reduce((acc, n) => acc + n.reach, 0);
  const avgEng =
    latest.networks.reduce((acc, n) => acc + n.engagementRate, 0) /
    Math.max(latest.networks.length, 1);

  const firstName = user?.name.split(/\s+/)[0] ?? "hola";

  useEffect(() => {
    if (!user) return;
    void listClients(user.id).then(setClients).catch(() => setClients([]));
    void listLeads()
      .then((rows) => setNewLeads(rows.filter((l) => l.status === "new").length))
      .catch(() => setNewLeads(0));
  }, [user]);

  return (
    <AppShell
      title={`Hola, ${firstName}`}
      description={`Dashboard de ${user?.agency ?? "tu agencia"} · ${user?.email ?? ""}`}
    >
      <SupabaseConfigBanner />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
            label: "Clientes CRM",
            value: String(clients.length),
          },
          {
            label: "Leads nuevos",
            value: String(newLeads),
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Clientes</h2>
            <p className="text-sm text-muted-foreground">Entra al perfil CRM de cada marca.</p>
          </div>
          <div className="flex gap-4 text-sm font-medium">
            <Link to="/app/leads" className="underline-offset-4 hover:underline">
              Ver leads
            </Link>
            <Link to="/app/clientes" className="underline-offset-4 hover:underline">
              Ver todos
            </Link>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {clients.slice(0, 3).map((client) => (
            <Link
              key={client.id}
              to="/app/clientes/$clientId"
              params={{ clientId: client.id }}
              className="rounded-2xl bg-surface-2/80 px-4 py-3 text-sm"
            >
              <p className="font-medium">{client.name}</p>
              <p className="text-xs text-muted-foreground">
                {client.networks.length} redes · {client.industry || "Sin industria"}
              </p>
            </Link>
          ))}
          {clients.length === 0 ? (
            <Link to="/app/clientes" className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              Agrega tu primer cliente
            </Link>
          ) : null}
        </div>
      </section>

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
