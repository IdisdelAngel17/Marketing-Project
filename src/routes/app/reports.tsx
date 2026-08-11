import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
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
import { Textarea } from "@/components/ui/textarea";
import { weeklyReports } from "@/data/weekly-reports";
import { useAuth } from "@/lib/auth/auth-context";
import {
  addPostToReport,
  autoInsights,
  buildNetworkSummaries,
  engagementRate,
  listWeeklyReports,
  saveWeeklyReport,
} from "@/lib/studio/persist";
import { NETWORK_LABELS, type PostPerformance, type SocialNetwork, type WeeklyReport } from "@/lib/types/studio";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [{ title: "Reportes semanales | Community Manager IA" }],
  }),
  component: ReportsPage,
});

const chartConfig = {
  reach: { label: "Alcance", color: "var(--chart-1)" },
  engagementRate: { label: "Engagement %", color: "var(--chart-2)" },
} satisfies ChartConfig;

function formatNumber(n: number) {
  return new Intl.NumberFormat("es-MX").format(n);
}

function networkBadgeClass(network: SocialNetwork) {
  switch (network) {
    case "instagram":
      return "bg-highlight/50 text-highlight-foreground";
    case "tiktok":
      return "bg-secondary/70 text-secondary-foreground";
    case "linkedin":
      return "bg-accent/60 text-accent-foreground";
    case "facebook":
      return "bg-primary/40 text-primary-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function slugId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function ReportsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<WeeklyReport[]>([]);
  const [weekId, setWeekId] = useState("");
  const [networkFilter, setNetworkFilter] = useState<SocialNetwork | "all">("all");
  const [postNetwork, setPostNetwork] = useState<SocialNetwork>("instagram");
  const [savingReport, setSavingReport] = useState(false);
  const [savingPost, setSavingPost] = useState(false);

  const allReports = saved.length ? saved : weeklyReports;
  const report = allReports.find((r) => r.id === weekId) ?? allReports[0] ?? null;

  useEffect(() => {
    if (!user) return;
    void listWeeklyReports(user.id)
      .then((rows) => {
        setSaved(rows);
        if (rows[0]) setWeekId(rows[0].id);
        else setWeekId(weeklyReports[0]?.id ?? "");
      })
      .catch(() => setSaved([]));
  }, [user]);

  const chartData = useMemo(
    () =>
      (report?.networks ?? []).map((n) => ({
        network: NETWORK_LABELS[n.network],
        reach: n.reach,
        engagementRate: n.engagementRate,
      })),
    [report],
  );

  const posts = useMemo(() => {
    const list =
      networkFilter === "all"
        ? report?.posts ?? []
        : (report?.posts ?? []).filter((p) => p.network === networkFilter);
    return [...list].sort((a, b) => b.engagementRate - a.engagementRate);
  }, [report, networkFilter]);

  const totals = useMemo(() => {
    if (!report) return { reach: 0, postsCount: 0, avgEng: 0, followersDelta: 0 };
    const reach = report.networks.reduce((acc, n) => acc + n.reach, 0);
    const postsCount = report.networks.reduce((acc, n) => acc + n.posts, 0);
    const avgEng =
      report.networks.reduce((acc, n) => acc + n.engagementRate, 0) /
      Math.max(report.networks.length, 1);
    const followersDelta = report.networks.reduce((acc, n) => acc + n.followersDelta, 0);
    return { reach, postsCount, avgEng, followersDelta };
  }, [report]);

  async function onCreateReport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const data = new FormData(e.currentTarget);
    const startDate = String(data.get("startDate") || format(new Date(), "yyyy-MM-dd"));
    const endDate = String(data.get("endDate") || startDate);
    const highlights = String(data.get("highlights") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const recommendations = String(data.get("recommendations") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const created: WeeklyReport = {
      id: slugId("week"),
      weekLabel: String(data.get("weekLabel") || `${startDate} – ${endDate}`),
      startDate,
      endDate,
      client: String(data.get("client") || user.agency),
      networks: [],
      posts: [],
      highlights,
      recommendations,
    };
    setSavingReport(true);
    try {
      await saveWeeklyReport(created, user.id);
      setSaved((prev) => [created, ...prev]);
      setWeekId(created.id);
      (e.target as HTMLFormElement).reset();
      toast.success("Reporte semanal creado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el reporte");
    } finally {
      setSavingReport(false);
    }
  }

  async function onAddPost(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !report || !saved.some((r) => r.id === report.id)) {
      toast.error("Crea un reporte propio antes de cargar publicaciones.");
      return;
    }
    const data = new FormData(e.currentTarget);
    const draft: PostPerformance = {
      id: slugId("post"),
      title: String(data.get("title") || ""),
      network: postNetwork,
      publishedAt: String(data.get("publishedAt") || format(new Date(), "yyyy-MM-dd")),
      reach: Number(data.get("reach") || 0),
      impressions: Number(data.get("impressions") || 0),
      likes: Number(data.get("likes") || 0),
      comments: Number(data.get("comments") || 0),
      shares: Number(data.get("shares") || 0),
      saves: Number(data.get("saves") || 0),
      clicks: Number(data.get("clicks") || 0),
      engagementRate: 0,
    };
    draft.engagementRate = engagementRate(draft);
    setSavingPost(true);
    try {
      await addPostToReport(report.id, draft, user.id);
      setSaved((prev) =>
        prev.map((item) => {
          if (item.id !== report.id) return item;
          const postsList = [...item.posts, draft];
          const insights = autoInsights(postsList);
          return {
            ...item,
            posts: postsList,
            networks: buildNetworkSummaries(postsList),
            highlights: item.highlights.length ? item.highlights : insights.highlights,
            recommendations: item.recommendations.length ? item.recommendations : insights.recommendations,
          };
        }),
      );
      (e.target as HTMLFormElement).reset();
      toast.success("Publicación agregada al reporte");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar la publicación");
    } finally {
      setSavingPost(false);
    }
  }

  return (
    <AppShell
      title="Reportes semanales"
      description="Crea un reporte por periodo y carga el desempeño de cada publicación y red social."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={onCreateReport}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <h2 className="font-semibold">Crear reporte semanal</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weekLabel">Etiqueta de la semana</Label>
              <Input id="weekLabel" name="weekLabel" placeholder="Ej. 4–10 ago 2026" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Cliente / marca</Label>
              <Input id="client" name="client" defaultValue={user?.agency} required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Inicio</Label>
              <Input id="startDate" name="startDate" type="date" required defaultValue={format(new Date(), "yyyy-MM-dd")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Cierre</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="highlights">Highlights (uno por línea)</Label>
              <Textarea id="highlights" name="highlights" className="min-h-20" placeholder="Opcional: se generan solos si hay posts" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendations">Recomendaciones (una por línea)</Label>
              <Textarea id="recommendations" name="recommendations" className="min-h-20" />
            </div>
          </div>
          <Button type="submit" disabled={savingReport} className="rounded-full">
            {savingReport ? <Loader2 className="animate-spin" /> : <Plus />}
            Crear reporte
          </Button>
        </form>

        <form
          onSubmit={onAddPost}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <h2 className="font-semibold">Desempeño de una publicación</h2>
          <p className="text-xs text-muted-foreground">
            Se suma al reporte seleccionado y recalcula el resumen por red.
          </p>
          <div className="space-y-2">
            <Label htmlFor="title">Título de la pieza</Label>
            <Input id="title" name="title" required placeholder="Ej. Reel: 3 tips de hooks" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Red social</Label>
              <Select value={postNetwork} onValueChange={(v) => setPostNetwork(v as SocialNetwork)}>
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
              <Label htmlFor="publishedAt">Fecha de publicación</Label>
              <Input id="publishedAt" name="publishedAt" type="date" required defaultValue={format(new Date(), "yyyy-MM-dd")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["reach", "Alcance"],
              ["impressions", "Impresiones"],
              ["likes", "Likes"],
              ["comments", "Comentarios"],
              ["shares", "Shares"],
              ["saves", "Guardados"],
              ["clicks", "Clics"],
            ].map(([name, label]) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Input id={name} name={name} type="number" min={0} defaultValue={0} />
              </div>
            ))}
          </div>
          <Button type="submit" disabled={savingPost} className="rounded-full">
            {savingPost ? <Loader2 className="animate-spin" /> : <Plus />}
            Agregar al reporte
          </Button>
        </form>
      </div>

      {!report ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Crea tu primer reporte semanal para ver KPIs por red y por publicación.
        </div>
      ) : (
        <>
          <div className="mt-8 mb-6 flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Semana</p>
              <Select value={report.id} onValueChange={setWeekId}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allReports.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.weekLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Red</p>
              <Select
                value={networkFilter}
                onValueChange={(v) => setNetworkFilter(v as SocialNetwork | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {(report.networks.length
                    ? report.networks.map((n) => n.network)
                    : (Object.keys(NETWORK_LABELS) as SocialNetwork[])
                  ).map((network) => (
                    <SelectItem key={network} value={network}>
                      {NETWORK_LABELS[network]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="pb-2 text-sm text-muted-foreground">
              Cliente: <span className="font-medium text-foreground">{report.client}</span>
              {saved.length === 0 ? " · ejemplo" : ""}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Alcance total", value: formatNumber(totals.reach) },
              { label: "Publicaciones", value: String(totals.postsCount) },
              { label: "Engagement promedio", value: `${totals.avgEng.toFixed(1)}%` },
              {
                label: "Variación seguidores",
                value: `${totals.followersDelta >= 0 ? "+" : ""}${formatNumber(totals.followersDelta)}`,
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

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Alcance por red</h2>
              {chartData.length ? (
                <ChartContainer config={chartConfig} className="mt-4 aspect-[16/9] w-full">
                  <BarChart data={chartData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="network" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={48} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="reach" fill="var(--color-reach)" radius={8} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Agrega publicaciones para ver la gráfica.</p>
              )}
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Resumen por red</h2>
              <ul className="mt-4 space-y-3">
                {report.networks.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Sin datos de red todavía.</li>
                ) : (
                  report.networks.map((n) => (
                    <li
                      key={n.network}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2/80 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{NETWORK_LABELS[n.network]}</p>
                        <p className="text-xs text-muted-foreground">
                          {n.posts} posts · {n.engagementRate}% eng.
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold">{formatNumber(n.reach)}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-lg font-semibold">Desempeño por publicación</h2>
              <p className="text-sm text-muted-foreground">Ordenado por engagement</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Publicación</TableHead>
                    <TableHead>Red</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Alcance</TableHead>
                    <TableHead className="text-right">Likes</TableHead>
                    <TableHead className="text-right">Comentarios</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Clics</TableHead>
                    <TableHead className="text-right">Eng. %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        Aún no hay publicaciones en este reporte.
                      </TableCell>
                    </TableRow>
                  ) : (
                    posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="max-w-[260px] font-medium">{post.title}</TableCell>
                        <TableCell>
                          <Badge className={networkBadgeClass(post.network)} variant="secondary">
                            {NETWORK_LABELS[post.network]}
                          </Badge>
                        </TableCell>
                        <TableCell>{post.publishedAt}</TableCell>
                        <TableCell className="text-right">{formatNumber(post.reach)}</TableCell>
                        <TableCell className="text-right">{formatNumber(post.likes)}</TableCell>
                        <TableCell className="text-right">{formatNumber(post.comments)}</TableCell>
                        <TableCell className="text-right">{formatNumber(post.shares)}</TableCell>
                        <TableCell className="text-right">{formatNumber(post.clicks)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {post.engagementRate.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Highlights</h2>
              <ul className="mt-4 space-y-3">
                {(report.highlights.length ? report.highlights : autoInsights(report.posts).highlights).map((h) => (
                  <li key={h} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Recomendaciones</h2>
              <ul className="mt-4 space-y-3">
                {(report.recommendations.length
                  ? report.recommendations
                  : autoInsights(report.posts).recommendations
                ).map((r) => (
                  <li key={r} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
