import { createFileRoute } from "@tanstack/react-router";
import {
  Compass,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { CopyButton } from "@/components/app/copy-button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  formatStrategyAsText,
  generateContentStrategy,
} from "@/lib/studio/generate-strategy";
import type { ContentStrategy, CopyGoal, SocialNetwork } from "@/lib/types/studio";
import { GOAL_LABELS, NETWORK_LABELS } from "@/lib/types/studio";

export const Route = createFileRoute("/app/estrategia")({
  head: () => ({
    meta: [{ title: "Estrategia | Community Manager IA" }],
  }),
  component: StrategyPage,
});

function StrategyPage() {
  const [network, setNetwork] = useState<SocialNetwork>("instagram");
  const [goal, setGoal] = useState<CopyGoal>("leads");
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<ContentStrategy | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 550));
    try {
      const result = generateContentStrategy({
        profileName: String(data.get("profileName") || ""),
        handle: String(data.get("handle") || ""),
        niche: String(data.get("niche") || ""),
        audience: String(data.get("audience") || ""),
        offer: String(data.get("offer") || ""),
        notes: String(data.get("notes") || ""),
        network,
        goal,
      });
      setStrategy(result);
      toast.success("Estrategia lista");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo generar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Estrategia de contenido"
      description="Arma el plan según el perfil, la red social y el objetivo, con insights de marketing."
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.22fr)]">
        <form
          onSubmit={onSubmit}
          className="h-fit space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/40">
              <Compass className="h-5 w-5 text-primary-foreground" />
            </span>
            <div>
              <h2 className="font-semibold">Brief del perfil</h2>
              <p className="text-xs text-muted-foreground">
                A más contexto, más accionable sale el plan.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profileName">Perfil / marca</Label>
              <Input
                id="profileName"
                name="profileName"
                required
                defaultValue="Marca Demo"
                placeholder="Ej. Estudio Norte"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <Input id="handle" name="handle" defaultValue="marca.demo" placeholder="sin @" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="niche">Nicho</Label>
            <Input
              id="niche"
              name="niche"
              defaultValue="agencias y community managers"
              placeholder="Ej. clínicas dentales"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Audiencia</Label>
            <Input
              id="audience"
              name="audience"
              placeholder="Ej. dueños de agencias de 3–15 personas"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Red social</Label>
              <Select value={network} onValueChange={(v) => setNetwork(v as SocialNetwork)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NETWORK_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Objetivo</Label>
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
            <Label htmlFor="offer">Oferta o siguiente paso (opcional)</Label>
            <Input
              id="offer"
              name="offer"
              placeholder="Ej. diagnóstico de 15 min por WhatsApp"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Contexto extra</Label>
            <Textarea
              id="notes"
              name="notes"
              className="min-h-20"
              placeholder="Ej. publicamos 2 veces por semana, ticket alto, audiencia fría"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-full">
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Diseñando estrategia…" : "Crear estrategia"}
          </Button>
        </form>

        {!strategy ? (
          <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center text-sm text-muted-foreground">
            Aquí verás posicionamiento, pilares, embudo, plan por fases e insights de marketing.
          </div>
        ) : (
          <div className="space-y-5">
            <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{NETWORK_LABELS[strategy.network]}</Badge>
                    <Badge className="bg-primary/30 text-primary-foreground" variant="secondary">
                      {GOAL_LABELS[strategy.goal]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">@{strategy.handle}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">{strategy.profileName}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {strategy.positioning}
                  </p>
                </div>
                <CopyButton text={formatStrategyAsText(strategy)} label="Copiar estrategia" />
              </div>
              <p className="mt-4 rounded-2xl bg-surface-2/80 px-4 py-3 text-sm">{strategy.promise}</p>
            </article>

            <Tabs defaultValue="plan">
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                <TabsTrigger value="plan">Plan</TabsTrigger>
                <TabsTrigger value="insights">Insights de marketing</TabsTrigger>
              </TabsList>

              <TabsContent value="plan" className="mt-4 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <Target className="h-4 w-4" />
                      Audiencia
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {strategy.audienceSnapshot}
                    </p>
                  </section>
                  <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <TrendingUp className="h-4 w-4" />
                      Métrica norte
                    </h3>
                    <p className="mt-2 font-display text-lg font-bold">{strategy.northStarMetric}</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {strategy.kpis.map((kpi) => (
                        <Badge key={kpi} variant="secondary">
                          {kpi}
                        </Badge>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground">{strategy.cadence}</p>
                  </section>
                </div>

                <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-semibold">Pilares y mix</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {strategy.mix.map((pillar) => (
                      <article key={pillar.name} className="rounded-2xl bg-surface-2/80 p-4">
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="font-medium">{pillar.name}</h4>
                          <span className="font-display text-lg font-bold text-primary-foreground">
                            {pillar.share}%
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{pillar.purpose}</p>
                        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Formatos
                        </p>
                        <p className="text-sm">{pillar.formats.join(" · ")}</p>
                        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                          {pillar.examples.map((ex) => (
                            <li key={ex}>• {ex}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-semibold">Embudo de contenido</h3>
                  <ol className="mt-4 grid gap-3 md:grid-cols-3">
                    {strategy.funnel.map((step) => (
                      <li key={step.stage} className="rounded-2xl border border-border p-4">
                        <p className="text-sm font-semibold">{step.stage}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{step.job}</p>
                        <p className="mt-3 text-sm leading-relaxed">{step.content}</p>
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-semibold">Fases 12 semanas</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {strategy.phases.map((phase) => (
                      <article key={phase.name} className="rounded-2xl bg-surface-2/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {phase.weeks}
                        </p>
                        <h4 className="mt-1 font-semibold">{phase.name}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{phase.focus}</p>
                        <ul className="mt-3 space-y-2 text-sm">
                          {phase.actions.map((action) => (
                            <li key={action} className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </section>

                <div className="grid gap-5 md:grid-cols-2">
                  <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="font-semibold">CTAs de la estrategia</h3>
                    <ul className="mt-4 space-y-2">
                      {strategy.ctas.map((cta) => (
                        <li
                          key={cta}
                          className="rounded-2xl bg-primary/20 px-4 py-3 text-sm font-medium"
                        >
                          {cta}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="font-semibold">Riesgos a evitar</h3>
                    <ul className="mt-4 space-y-3">
                      {strategy.risks.map((risk) => (
                        <li key={risk} className="flex gap-3 text-sm text-muted-foreground">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="insights" className="mt-4 space-y-4">
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Lightbulb className="h-4 w-4" />
                    Insights de marketing
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Principios de algoritmo, psicología y mix aplicados a{" "}
                    {NETWORK_LABELS[strategy.network]} y al objetivo {GOAL_LABELS[strategy.goal]}.
                  </p>
                </div>
                {strategy.insights.map((insight) => (
                  <article
                    key={insight.id}
                    className="rounded-3xl border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{insight.category}</Badge>
                      <h4 className="font-semibold">{insight.title}</h4>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed">{insight.insight}</p>
                    <div className="mt-4 rounded-2xl bg-primary/20 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-primary-foreground">
                        Cómo usarlo
                      </p>
                      <p className="mt-1 text-sm font-medium">{insight.howToUse}</p>
                    </div>
                  </article>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </AppShell>
  );
}
