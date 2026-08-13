import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ExternalLink,
  Lightbulb,
  Loader2,
  Radar,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { CopyButton } from "@/components/app/copy-button";
import { ClientPicker, ClientWorkBanner, useAgencyClients } from "@/components/crm/client-picker";
import { useAuth } from "@/lib/auth/auth-context";
import { clientSearchSchema } from "@/lib/crm/search";
import { saveClientAnalysis } from "@/lib/crm/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  analyzeSocialProfile,
  formatAnalysisAsText,
  ProfileUrlError,
} from "@/lib/studio/analyze-profile";
import type {
  CopyGoal,
  OpportunityPriority,
  ProfileAnalysis,
} from "@/lib/types/studio";
import { GOAL_LABELS, NETWORK_LABELS } from "@/lib/types/studio";

export const Route = createFileRoute("/app/analisis")({
  validateSearch: clientSearchSchema,
  head: () => ({
    meta: [{ title: "Análisis de perfil | Community Manager IA" }],
  }),
  component: AnalysisPage,
});

function priorityClass(priority: OpportunityPriority) {
  switch (priority) {
    case "alta":
      return "bg-destructive/15 text-destructive";
    case "media":
      return "bg-accent/60 text-accent-foreground";
    case "rapida":
      return "bg-primary/35 text-primary-foreground";
  }
}

function priorityLabel(priority: OpportunityPriority) {
  switch (priority) {
    case "alta":
      return "Prioridad alta";
    case "media":
      return "Prioridad media";
    case "rapida":
      return "Victoria rápida";
  }
}

function AnalysisPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { client: clientId } = Route.useSearch();
  const { selected } = useAgencyClients();
  const activeClient = selected(clientId);
  const [goal, setGoal] = useState<CopyGoal>("engagement");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>("");

  useEffect(() => {
    setSelectedNetworkId(activeClient?.networks[0]?.id ?? "");
  }, [activeClient?.id]);

  const selectedNetwork =
    activeClient?.networks.find((n) => n.id === selectedNetworkId) ?? activeClient?.networks[0];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    try {
      const result = analyzeSocialProfile({
        url: String(data.get("url") || ""),
        niche: String(data.get("niche") || ""),
        notes: String(data.get("notes") || ""),
        goal,
      });
      setAnalysis(result);
      if (user && clientId) {
        await saveClientAnalysis(user.id, clientId, result);
      }
      toast.success(clientId ? "Análisis listo y guardado en el CRM" : "Análisis listo");
    } catch (err) {
      setAnalysis(null);
      toast.error(
        err instanceof ProfileUrlError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No se pudo analizar el link",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Análisis de perfil"
      description="Pega el link de una red social y obtén áreas de oportunidad con consejos accionables."
    >
      <ClientWorkBanner client={activeClient} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)]">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <ClientPicker
            value={clientId}
            onChange={(id) => void navigate({ to: "/app/analisis", search: { client: id } })}
          />
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/40">
              <Radar className="h-5 w-5 text-primary-foreground" />
            </span>
            <div>
              <h2 className="font-semibold">Link del perfil</h2>
              <p className="text-xs text-muted-foreground">
                Instagram, TikTok, LinkedIn, Facebook, YouTube o X.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL del perfil</Label>
            <Input
              id="url"
              name="url"
              type="url"
              required
              placeholder="https://instagram.com/tu_marca"
              key={`${activeClient?.id || "url"}-${selectedNetwork?.id || "demo"}`}
              defaultValue={selectedNetwork?.url || "https://instagram.com/comunidad.demo"}
            />
          </div>
          {activeClient?.networks.length ? (
            <div className="flex flex-wrap gap-2">
              {activeClient.networks.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSelectedNetworkId(n.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    selectedNetwork?.id === n.id
                      ? "border-primary bg-primary/20 font-medium"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {NETWORK_LABELS[n.network]}
                  {n.handle ? ` · @${n.handle}` : ""}
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="niche">Nicho o industria</Label>
              <Input
                id="niche"
                name="niche"
                key={`${activeClient?.id || "niche"}-n`}
                defaultValue={activeClient?.industry || ""}
                placeholder="Ej. agencias, clínicas, foodie"
              />
            </div>
            <div className="space-y-2">
              <Label>Objetivo principal</Label>
              <Select value={goal} onValueChange={(v) => setGoal(v as CopyGoal)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Contexto extra (opcional)</Label>
            <Textarea
              id="notes"
              name="notes"
              key={`${activeClient?.id || "notes"}-notes`}
              defaultValue={activeClient?.notes || ""}
              placeholder="Ej. publicamos 2 veces por semana, queremos más leads por WhatsApp"
              className="min-h-24"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-full">
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Analizando perfil…" : "Analizar perfil"}
          </Button>
        </form>

        {!analysis ? (
          <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center text-sm text-muted-foreground">
            El diagnóstico completo aparecerá aquí: score, hallazgos, consejos y plan a 30 días.
          </div>
        ) : (
          <div className="space-y-5">
            <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{NETWORK_LABELS[analysis.network]}</Badge>
                    <span className="text-sm text-muted-foreground">@{analysis.handle}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">
                    Score de oportunidad: {analysis.score}/100
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {analysis.summary}
                  </p>
                  <a
                    href={analysis.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Abrir perfil
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <CopyButton text={formatAnalysisAsText(analysis)} label="Copiar análisis" />
              </div>

              <div className="mt-5">
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${analysis.score}%` }}
                  />
                </div>
              </div>
            </article>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="flex items-center gap-2 font-semibold">
                <Target className="h-4 w-4" />
                Fortalezas detectadas
              </h3>
              <ul className="mt-4 space-y-2">
                {analysis.strengths.map((s) => (
                  <li
                    key={s}
                    className="rounded-2xl bg-surface-2/80 px-4 py-3 text-sm text-muted-foreground"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="font-semibold">Áreas de oportunidad y consejos</h3>
              {analysis.opportunities.map((opp) => (
                <article
                  key={opp.id}
                  className="rounded-3xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold">{opp.area}</h4>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityClass(opp.priority)}`}
                    >
                      {priorityLabel(opp.priority)}
                    </span>
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Hallazgo
                      </dt>
                      <dd className="mt-1 leading-relaxed">{opp.finding}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Consejo
                      </dt>
                      <dd className="mt-1 leading-relaxed">{opp.advice}</dd>
                    </div>
                    <div className="rounded-2xl bg-primary/20 px-4 py-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-primary-foreground">
                        Acción sugerida
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">{opp.action}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Lightbulb className="h-4 w-4" />
                  Ideas de contenido
                </h3>
                <ul className="mt-4 space-y-3">
                  {analysis.contentIdeas.map((idea) => (
                    <li key={idea} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {idea}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-semibold">Plan 30 días</h3>
                <ol className="mt-4 space-y-3">
                  {analysis.next30Days.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="font-display text-sm font-bold text-primary/80">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
