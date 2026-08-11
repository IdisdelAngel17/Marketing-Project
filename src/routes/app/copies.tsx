import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
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
import { generatePostCopies } from "@/lib/studio/generate-copy";
import { listSavedCopies, saveGeneratedCopies, type SavedCopy } from "@/lib/studio/persist";
import type {
  CopyGoal,
  GeneratedCopy,
  SocialNetwork,
  Tone,
} from "@/lib/types/studio";
import {
  GOAL_LABELS,
  NETWORK_LABELS,
  TONE_LABELS,
} from "@/lib/types/studio";

export const Route = createFileRoute("/app/copies")({
  head: () => ({
    meta: [{ title: "Copies de publicaciones | Community Manager IA" }],
  }),
  component: CopiesPage,
});

function CopiesPage() {
  const { user } = useAuth();
  const [network, setNetwork] = useState<SocialNetwork>("instagram");
  const [tone, setTone] = useState<Tone>("cercano");
  const [goal, setGoal] = useState<CopyGoal>("engagement");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedCopy[]>([]);
  const [history, setHistory] = useState<SavedCopy[]>([]);

  useEffect(() => {
    if (!user) return;
    void listSavedCopies(user.id).then(setHistory).catch(() => setHistory([]));
  }, [user]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));
    const request = {
      brand: String(data.get("brand") || "Marca"),
      network,
      topic: String(data.get("topic") || ""),
      audience: String(data.get("audience") || ""),
      tone,
      goal,
      cta: String(data.get("cta") || ""),
      keywords: String(data.get("keywords") || ""),
    };
    const copies = generatePostCopies(request);
    setResults(copies);
    if (user) {
      try {
        const saved = await saveGeneratedCopies(request, copies, user.id);
        setHistory((prev) => [...saved, ...prev].slice(0, 30));
        toast.success("Copies creados y guardados");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Se generaron, pero no se guardaron");
      }
    }
    setLoading(false);
  }

  return (
    <AppShell
      title="Copies de publicaciones"
      description="Genera 3 variantes listas para publicar según red, tono y objetivo."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="brand">Marca o cliente</Label>
            <Input id="brand" name="brand" placeholder="Ej. Estudio Norte" required defaultValue="Marca Demo" />
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Tema o ángulo</Label>
            <Textarea
              id="topic"
              name="topic"
              required
              placeholder="Ej. Cómo organizar el calendario editorial en 20 minutos"
              className="min-h-24"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience">Audiencia</Label>
            <Input
              id="audience"
              name="audience"
              placeholder="Ej. dueños de agencias y community managers"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="space-y-2">
              <Label htmlFor="cta">CTA</Label>
              <Input id="cta" name="cta" placeholder="Ej. Escríbenos por WhatsApp" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="keywords">Palabras clave (opcional)</Label>
            <Input id="keywords" name="keywords" placeholder="calendario, contenido, agencia" />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-full">
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Generando…" : "Generar copies"}
          </Button>
        </form>

        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center text-sm text-muted-foreground">
              Completa el formulario y genera variantes de copy para revisar y copiar.
            </div>
          ) : (
            results.map((copy) => (
              <article
                key={copy.id}
                className="rounded-3xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{copy.headline}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{copy.notes}</p>
                  </div>
                  <CopyButton
                    text={`${copy.body}\n\n${copy.hashtags.join(" ")}`}
                    label="Copiar todo"
                  />
                </div>
                <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {copy.body}
                </pre>
                <p className="mt-4 text-sm text-muted-foreground">{copy.hashtags.join(" ")}</p>
              </article>
            ))
          )}

          {history.length > 0 ? (
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-semibold">Copies guardados</h2>
              <ul className="mt-4 space-y-3">
                {history.slice(0, 8).map((item) => (
                  <li key={item.id} className="rounded-2xl bg-surface-2/80 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{item.headline}</p>
                        <p className="text-xs text-muted-foreground">
                          {NETWORK_LABELS[item.network]} · {item.brand}
                        </p>
                      </div>
                      <CopyButton text={`${item.body}\n\n${item.hashtags.join(" ")}`} label="Copiar" />
                    </div>
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
