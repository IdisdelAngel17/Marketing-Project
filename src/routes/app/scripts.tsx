import { createFileRoute } from "@tanstack/react-router";
import { Clapperboard, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { CopyButton } from "@/components/app/copy-button";
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
import { useAuth } from "@/lib/auth/auth-context";
import { generateVideoScript } from "@/lib/studio/generate-script";
import { listSavedScripts, saveGeneratedScript, type SavedScript } from "@/lib/studio/persist";
import type {
  CopyGoal,
  GeneratedScript,
  Tone,
  VideoDuration,
  VideoFormat,
} from "@/lib/types/studio";
import {
  FORMAT_LABELS,
  GOAL_LABELS,
  TONE_LABELS,
} from "@/lib/types/studio";

export const Route = createFileRoute("/app/scripts")({
  head: () => ({
    meta: [{ title: "Guiones de video | Community Manager IA" }],
  }),
  component: ScriptsPage,
});

function ScriptsPage() {
  const { user } = useAuth();
  const [format, setFormat] = useState<VideoFormat>("reels");
  const [duration, setDuration] = useState<VideoDuration>("30");
  const [tone, setTone] = useState<Tone>("directo");
  const [goal, setGoal] = useState<CopyGoal>("alcance");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [history, setHistory] = useState<SavedScript[]>([]);

  useEffect(() => {
    if (!user) return;
    void listSavedScripts(user.id).then(setHistory).catch(() => setHistory([]));
  }, [user]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));
    const request = {
      brand: String(data.get("brand") || "Marca"),
      format,
      duration,
      topic: String(data.get("topic") || ""),
      audience: String(data.get("audience") || ""),
      tone,
      goal,
      cta: String(data.get("cta") || ""),
    };
    const generated = generateVideoScript(request);
    setScript(generated);
    if (user) {
      try {
        const saved = await saveGeneratedScript(request, generated, user.id);
        setHistory((prev) => [saved, ...prev].slice(0, 20));
        toast.success("Guion creado y guardado");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Se generó, pero no se guardó");
      }
    }
    setLoading(false);
  }

  const fullText = script
    ? [
        script.title,
        "",
        `HOOK: ${script.hook}`,
        "",
        ...script.scenes.flatMap((s, i) => [
          `Escena ${i + 1} (${s.time})`,
          `Visual: ${s.visual}`,
          `Voz: ${s.voiceover}`,
          `Texto en pantalla: ${s.onScreenText}`,
          "",
        ]),
        `CTA: ${script.cta}`,
        "",
        "Caption:",
        script.caption,
        "",
        script.hashtags.join(" "),
      ].join("\n")
    : "";

  return (
    <AppShell
      title="Guiones para videos"
      description="Arma el guion por escenas: hook, visual, voz y texto en pantalla."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="brand">Marca o cliente</Label>
            <Input id="brand" name="brand" required defaultValue="Marca Demo" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as VideoFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMAT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duración</Label>
              <Select value={duration} onValueChange={(v) => setDuration(v as VideoDuration)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["15", "30", "60", "90"] as VideoDuration[]).map((d) => (
                    <SelectItem key={d} value={d}>
                      {d} segundos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Tema del video</Label>
            <Textarea
              id="topic"
              name="topic"
              required
              placeholder="Ej. 3 tips para mejorar el primer segundo de un Reel"
              className="min-h-24"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience">Audiencia</Label>
            <Input id="audience" name="audience" placeholder="Ej. creadores y CMs juniors" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tono</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TONE_LABELS).map(([value, label]) => (
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
            <Label htmlFor="cta">CTA final</Label>
            <Input id="cta" name="cta" placeholder="Ej. Síguenos para la parte 2" />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-full">
            {loading ? <Loader2 className="animate-spin" /> : <Clapperboard />}
            {loading ? "Escribiendo guion…" : "Generar guion"}
          </Button>
        </form>

        <div className="space-y-5">
          {!script ? (
            <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center text-sm text-muted-foreground">
              El guion aparecerá aquí con tiempos, visuales y voz en off.
            </div>
          ) : (
            <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{script.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Hook: {script.hook}
                  </p>
                </div>
                <CopyButton text={fullText} label="Copiar guion" />
              </div>

              <ol className="mt-6 space-y-4">
                {script.scenes.map((scene, index) => (
                  <li
                    key={`${scene.time}-${index}`}
                    className="rounded-2xl border border-border bg-surface-2/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-display text-sm font-semibold">
                        Escena {index + 1}
                      </span>
                      <span className="rounded-full bg-primary/30 px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                        {scene.time}
                      </span>
                    </div>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Visual
                        </dt>
                        <dd>{scene.visual}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Voz en off
                        </dt>
                        <dd>{scene.voiceover}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Texto en pantalla
                        </dt>
                        <dd>{scene.onScreenText}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ol>

              <div className="mt-6 rounded-2xl border border-border p-4">
                <h3 className="text-sm font-semibold">Caption sugerido</h3>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
                  {script.caption}
                </pre>
                <p className="mt-3 text-sm">{script.hashtags.join(" ")}</p>
              </div>
            </article>
          )}

          {history.length > 0 ? (
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-semibold">Guiones guardados</h2>
              <ul className="mt-4 space-y-3">
                {history.slice(0, 6).map((item) => (
                  <li key={item.id} className="rounded-2xl bg-surface-2/80 px-4 py-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Hook: {item.hook}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
