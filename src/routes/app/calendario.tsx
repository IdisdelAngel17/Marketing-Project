import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarDays, Download, Loader2, Sparkles } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { CopyButton } from "@/components/app/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calendarToCsv,
  formatCalendarAsText,
  generateContentCalendar,
} from "@/lib/studio/generate-calendar";
import type {
  ContentCalendar,
  CopyGoal,
  SocialNetwork,
  Tone,
} from "@/lib/types/studio";
import {
  FORMAT_CONTENT_LABELS,
  GOAL_LABELS,
  NETWORK_LABELS,
  PILLAR_LABELS,
  TONE_LABELS,
} from "@/lib/types/studio";

export const Route = createFileRoute("/app/calendario")({
  head: () => ({
    meta: [{ title: "Calendario de posts | Community Manager IA" }],
  }),
  component: CalendarPage,
});

const ALL_NETWORKS = Object.keys(NETWORK_LABELS) as SocialNetwork[];

function CalendarPage() {
  const [goal, setGoal] = useState<CopyGoal>("engagement");
  const [tone, setTone] = useState<Tone>("cercano");
  const [days, setDays] = useState<7 | 14 | 30>(14);
  const [networks, setNetworks] = useState<SocialNetwork[]>([
    "instagram",
    "tiktok",
    "linkedin",
  ]);
  const [loading, setLoading] = useState(false);
  const [calendar, setCalendar] = useState<ContentCalendar | null>(null);
  const [activeNetwork, setActiveNetwork] = useState<SocialNetwork>("instagram");

  const totalPosts = useMemo(
    () => calendar?.networks.reduce((acc, n) => acc + n.posts.length, 0) ?? 0,
    [calendar],
  );

  function toggleNetwork(network: SocialNetwork, checked: boolean) {
    setNetworks((prev) => {
      if (checked) return [...new Set([...prev, network])];
      return prev.filter((n) => n !== network);
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    try {
      const result = generateContentCalendar({
        profileName: String(data.get("profileName") || ""),
        handle: String(data.get("handle") || ""),
        niche: String(data.get("niche") || ""),
        goal,
        tone,
        startDate: String(data.get("startDate") || format(new Date(), "yyyy-MM-dd")),
        days,
        networks,
      });
      setCalendar(result);
      setActiveNetwork(result.networks[0]?.network ?? "instagram");
      toast.success(`Calendario listo: ${result.networks.length} redes`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo generar");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    if (!calendar) return;
    const blob = new Blob([calendarToCsv(calendar)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendario-${calendar.handle}-${calendar.startDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV descargado");
  }

  return (
    <AppShell
      title="Calendario de posts"
      description="Genera un plan editorial por perfil y por cada red social seleccionada."
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)]">
        <form
          onSubmit={onSubmit}
          className="h-fit space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/40">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </span>
            <div>
              <h2 className="font-semibold">Perfil y periodo</h2>
              <p className="text-xs text-muted-foreground">
                Un calendario distinto por red, adaptado al formato nativo.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profileName">Nombre del perfil / marca</Label>
              <Input
                id="profileName"
                name="profileName"
                required
                defaultValue="Marca Demo"
                placeholder="Ej. Estudio Norte"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handle">Usuario / handle</Label>
              <Input
                id="handle"
                name="handle"
                defaultValue="marca.demo"
                placeholder="sin @"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="niche">Nicho o audiencia</Label>
            <Input
              id="niche"
              name="niche"
              defaultValue="agencias y community managers"
              placeholder="Ej. clínicas dentales"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                required
                defaultValue={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div className="space-y-2">
              <Label>Duración</Label>
              <Select
                value={String(days)}
                onValueChange={(v) => setDays(Number(v) as 7 | 14 | 30)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="14">14 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Redes sociales</Label>
            <div className="grid grid-cols-2 gap-3">
              {ALL_NETWORKS.map((network) => {
                const checked = networks.includes(network);
                return (
                  <label
                    key={network}
                    className="flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-surface-2/50 px-3 py-2.5 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggleNetwork(network, value === true)
                      }
                    />
                    {NETWORK_LABELS[network]}
                  </label>
                );
              })}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-full">
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Generando calendario…" : "Generar calendario"}
          </Button>
        </form>

        {!calendar ? (
          <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center text-sm text-muted-foreground">
            El calendario por red y perfil aparecerá aquí con fechas, formatos, pilares y CTAs.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    {calendar.profileName}{" "}
                    <span className="text-muted-foreground">@{calendar.handle}</span>
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {calendar.startDate} → {calendar.endDate} · {totalPosts} publicaciones ·{" "}
                    {calendar.networks.length} redes
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyButton text={formatCalendarAsText(calendar)} label="Copiar plan" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={downloadCsv}
                  >
                    <Download />
                    CSV
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {calendar.networks.map((net) => (
                  <div
                    key={net.network}
                    className="rounded-2xl bg-surface-2/80 px-4 py-3"
                  >
                    <p className="text-sm font-medium">{NETWORK_LABELS[net.network]}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {net.posts.length} posts · ~{net.postsPerWeek}/semana
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Tabs
              value={activeNetwork}
              onValueChange={(v) => setActiveNetwork(v as SocialNetwork)}
            >
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                {calendar.networks.map((net) => (
                  <TabsTrigger key={net.network} value={net.network}>
                    {NETWORK_LABELS[net.network]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {calendar.networks.map((net) => (
                <TabsContent key={net.network} value={net.network} className="mt-4">
                  <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                      <h3 className="font-semibold">
                        Calendario · {NETWORK_LABELS[net.network]}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Perfil @{calendar.handle} · {net.posts.length} piezas
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Hora</TableHead>
                            <TableHead>Formato</TableHead>
                            <TableHead>Pilar</TableHead>
                            <TableHead>Pieza</TableHead>
                            <TableHead>CTA</TableHead>
                            <TableHead>Assets</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {net.posts.map((post) => (
                            <TableRow key={post.id}>
                              <TableCell className="whitespace-nowrap">
                                <div className="font-medium">{post.date}</div>
                                <div className="text-xs capitalize text-muted-foreground">
                                  {post.weekday}
                                </div>
                              </TableCell>
                              <TableCell>{post.time}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {FORMAT_CONTENT_LABELS[post.format]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-primary/30 text-primary-foreground" variant="secondary">
                                  {PILLAR_LABELS[post.pillar]}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[240px]">
                                <p className="font-medium">{post.title}</p>
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                  {post.caption}
                                </p>
                              </TableCell>
                              <TableCell className="max-w-[140px] text-sm">
                                {post.cta}
                              </TableCell>
                              <TableCell className="max-w-[140px] text-xs text-muted-foreground">
                                {post.assets}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    </AppShell>
  );
}
