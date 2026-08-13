import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  Clapperboard,
  Compass,
  Film,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  PenLine,
  Phone,
  Plus,
  Radar,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useAuth } from "@/lib/auth/auth-context";
import {
  addClientNetwork,
  deleteClient,
  getClientWorkspace,
  initials,
  removeClientNetwork,
  updateClient,
} from "@/lib/crm/store";
import { STATUS_LABELS, type ClientStatus, type ClientWorkspace } from "@/lib/crm/types";
import { NETWORK_LABELS, type SocialNetwork } from "@/lib/types/studio";

export const Route = createFileRoute("/app/clientes/$clientId")({
  head: () => ({
    meta: [{ title: "Perfil de cliente | Community Manager IA" }],
  }),
  component: ClientProfilePage,
});

const tools = [
  { to: "/app/analisis" as const, icon: Radar, label: "Análisis", tab: "analisis" },
  { to: "/app/estrategia" as const, icon: Compass, label: "Estrategia", tab: "estrategia" },
  { to: "/app/calendario" as const, icon: CalendarDays, label: "Calendario", tab: "calendario" },
  { to: "/app/copies" as const, icon: PenLine, label: "Copies", tab: "copies" },
  { to: "/app/scripts" as const, icon: Clapperboard, label: "Guiones", tab: "scripts" },
  { to: "/app/editor" as const, icon: Film, label: "Editor", tab: "editor" },
  { to: "/app/reports" as const, icon: BarChart3, label: "Reportes", tab: "reports" },
  { to: "/app/correos" as const, icon: Mail, label: "Correos", tab: "correos" },
];

function ClientProfilePage() {
  const { clientId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<ClientWorkspace | null>(null);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [network, setNetwork] = useState<SocialNetwork>("instagram");
  const [status, setStatus] = useState<ClientStatus>("active");

  async function reload() {
    if (!user) return;
    const data = await getClientWorkspace(user.id, clientId);
    if (!data) {
      setMissing(true);
      return;
    }
    setWorkspace(data);
    setStatus(data.client.status);
  }

  useEffect(() => {
    void reload().catch(() => setMissing(true));
  }, [user, clientId]);

  if (missing) {
    return (
      <AppShell title="Cliente no encontrado">
        <p className="text-sm text-muted-foreground">Esa ficha no existe o no te pertenece.</p>
        <Button className="mt-4 rounded-full" onClick={() => void navigate({ to: "/app/clientes" })}>
          Volver al CRM
        </Button>
      </AppShell>
    );
  }

  if (!workspace) {
    return (
      <AppShell title="Cargando cliente">
        <p className="text-sm text-muted-foreground">Abriendo ficha CRM…</p>
      </AppShell>
    );
  }

  const { client } = workspace;

  async function onSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const data = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await updateClient(user.id, client.id, {
        name: String(data.get("name") || ""),
        brand: String(data.get("brand") || ""),
        industry: String(data.get("industry") || ""),
        contactName: String(data.get("contactName") || ""),
        email: String(data.get("email") || ""),
        phone: String(data.get("phone") || ""),
        website: String(data.get("website") || ""),
        notes: String(data.get("notes") || ""),
        status,
      });
      toast.success("Perfil actualizado");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function onAddNetwork(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const data = new FormData(e.currentTarget);
    try {
      await addClientNetwork(user.id, client.id, {
        network,
        handle: String(data.get("handle") || ""),
        url: String(data.get("url") || ""),
      });
      toast.success("Red agregada");
      (e.currentTarget as HTMLFormElement).reset();
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar la red");
    }
  }

  return (
    <AppShell
      title={client.name}
      description={`${client.brand || "Marca"} · ${client.industry || "Sin industria"}`}
    >
      <Link
        to="/app/clientes"
        className="mb-4 inline-flex text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Todos los clientes
      </Link>
      <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/40 text-lg font-semibold text-primary-foreground">
                {initials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{client.name}</h2>
                <Badge variant="secondary">{STATUS_LABELS[client.status]}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {client.contactName || "Sin contacto"} {client.email ? `· ${client.email}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {client.phone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {client.phone}
                  </span>
                ) : null}
                {client.website ? (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" /> Sitio
                  </a>
                ) : null}
                {client.email ? (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {client.email}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="rounded-full text-destructive"
            onClick={() => {
              if (!user) return;
              if (!confirm("¿Eliminar este cliente y su ficha?")) return;
              void deleteClient(user.id, client.id)
                .then(() => {
                  toast.success("Cliente eliminado");
                  void navigate({ to: "/app/clientes" });
                })
                .catch((err) => toast.error(err instanceof Error ? err.message : "No se pudo eliminar"));
            }}
          >
            <Trash2 />
            Eliminar
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {[
            { label: "Redes", value: client.networks.length },
            { label: "Análisis", value: workspace.analyses.length },
            { label: "Estrategia", value: workspace.strategies.length },
            { label: "Calendario", value: workspace.calendars.length },
            { label: "Copies", value: workspace.copies.length },
            { label: "Guiones", value: workspace.scripts.length },
            { label: "Reportes", value: workspace.reports.length },
            { label: "Correos", value: workspace.mails.length },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl bg-surface-2/80 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-8">
        {tools.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            search={{ client: client.id }}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-sm transition-shadow hover:shadow-md"
          >
            <tool.icon className="mb-2 h-4 w-4" />
            {tool.label}
          </Link>
        ))}
      </div>

      <Tabs defaultValue="ficha">
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="ficha">Ficha</TabsTrigger>
          <TabsTrigger value="redes">Redes</TabsTrigger>
          <TabsTrigger value="analisis">Análisis</TabsTrigger>
          <TabsTrigger value="estrategia">Estrategia</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="copies">Copies</TabsTrigger>
          <TabsTrigger value="scripts">Guiones</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="correos">Correos</TabsTrigger>
        </TabsList>

        <TabsContent value="ficha">
          <form
            onSubmit={onSaveProfile}
            className="grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={client.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input id="brand" name="brand" defaultValue={client.brand} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industria</Label>
              <Input id="industry" name="industry" defaultValue={client.industry} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ClientStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contacto</Label>
              <Input id="contactName" name="contactName" defaultValue={client.contactName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={client.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={client.phone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Sitio</Label>
              <Input id="website" name="website" defaultValue={client.website} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas del cliente</Label>
              <Textarea id="notes" name="notes" defaultValue={client.notes} className="min-h-24" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving} className="rounded-full">
                {saving ? <Loader2 className="animate-spin" /> : null}
                Guardar ficha
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="redes" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={onAddNetwork} className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Agregar red social</h3>
            <div className="space-y-2">
              <Label>Red</Label>
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
              <Label htmlFor="handle">Usuario</Label>
              <Input id="handle" name="handle" placeholder="sin @" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Link del perfil</Label>
              <Input id="url" name="url" placeholder="https://instagram.com/marca" />
            </div>
            <Button type="submit" className="w-full rounded-full">
              <Plus />
              Agregar red
            </Button>
          </form>
          <div className="space-y-3">
            {client.networks.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-border p-8 text-sm text-muted-foreground">
                Todavía no hay redes. Agrégalas para analizar y calendarizar por perfil.
              </p>
            ) : (
              client.networks.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{NETWORK_LABELS[n.network]}</p>
                    <p className="text-sm text-muted-foreground">
                      {n.handle ? `@${n.handle}` : "Sin handle"} {n.url ? `· ${n.url}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {n.url ? (
                      <a href={n.url} target="_blank" rel="noreferrer" className="text-muted-foreground">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!user) return;
                        void removeClientNetwork(user.id, client.id, n.id)
                          .then(() => reload())
                          .catch((err) =>
                            toast.error(err instanceof Error ? err.message : "No se pudo quitar"),
                          );
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analisis" className="space-y-3">
          <ToolHeader clientId={client.id} to="/app/analisis" label="Nuevo análisis" />
          {workspace.analyses.length === 0 ? (
            <Empty text="Aún no hay análisis para este cliente." />
          ) : (
            workspace.analyses.map((item) => (
              <article key={item.id} className="rounded-3xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">{item.createdAt.slice(0, 10)}</p>
                <h3 className="mt-1 font-semibold">
                  {NETWORK_LABELS[item.analysis.network]} · @{item.analysis.handle}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.analysis.summary}</p>
                <p className="mt-2 text-sm font-medium">Score {item.analysis.score}/100</p>
              </article>
            ))
          )}
        </TabsContent>

        <TabsContent value="estrategia" className="space-y-3">
          <ToolHeader clientId={client.id} to="/app/estrategia" label="Nueva estrategia" />
          {workspace.strategies.length === 0 ? (
            <Empty text="Todavía no hay estrategias guardadas." />
          ) : (
            workspace.strategies.map((item) => (
              <article key={item.id} className="rounded-3xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">{item.createdAt.slice(0, 10)}</p>
                <h3 className="mt-1 font-semibold">{item.strategy.promise}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.strategy.positioning}</p>
              </article>
            ))
          )}
        </TabsContent>

        <TabsContent value="calendario" className="space-y-3">
          <ToolHeader clientId={client.id} to="/app/calendario" label="Nuevo calendario" />
          {workspace.calendars.length === 0 ? (
            <Empty text="Sin calendarios todavía." />
          ) : (
            workspace.calendars.map((item) => (
              <article key={item.id} className="rounded-3xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">
                  {item.calendar.startDate} → {item.calendar.endDate}
                </p>
                <h3 className="mt-1 font-semibold">{item.calendar.profileName}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.calendar.networks.length} redes ·{" "}
                  {item.calendar.networks.reduce((acc, n) => acc + n.posts.length, 0)} posts
                </p>
              </article>
            ))
          )}
        </TabsContent>

        <TabsContent value="copies" className="space-y-3">
          <ToolHeader clientId={client.id} to="/app/copies" label="Nuevos copies" />
          {workspace.copies.length === 0 ? (
            <Empty text="Sin copies guardados." />
          ) : (
            workspace.copies.slice(0, 12).map((copy) => (
              <article key={copy.id} className="rounded-3xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">
                  {NETWORK_LABELS[copy.network]} · {copy.createdAt.slice(0, 10)}
                </p>
                <h3 className="mt-1 font-semibold">{copy.headline}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{copy.body}</p>
              </article>
            ))
          )}
        </TabsContent>

        <TabsContent value="scripts" className="space-y-3">
          <ToolHeader clientId={client.id} to="/app/scripts" label="Nuevo guion" />
          {workspace.scripts.length === 0 ? (
            <Empty text="Sin guiones todavía." />
          ) : (
            workspace.scripts.map((script) => (
              <article key={script.id} className="rounded-3xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">{script.createdAt.slice(0, 10)}</p>
                <h3 className="mt-1 font-semibold">{script.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">Hook: {script.hook}</p>
              </article>
            ))
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-3">
          <ToolHeader clientId={client.id} to="/app/reports" label="Nuevo reporte" />
          {workspace.reports.length === 0 ? (
            <Empty text="Sin reportes para este cliente." />
          ) : (
            workspace.reports.map((report) => (
              <article key={report.id} className="rounded-3xl border border-border bg-card p-5">
                <h3 className="font-semibold">{report.weekLabel}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {report.posts.length} publicaciones · {report.networks.length} redes
                </p>
              </article>
            ))
          )}
        </TabsContent>

        <TabsContent value="correos" className="space-y-3">
          <ToolHeader clientId={client.id} to="/app/correos" label="Nuevo correo" />
          {workspace.mails.length === 0 ? (
            <Empty text="Aún no hay correos enviados a este cliente." />
          ) : (
            workspace.mails.map((mail) => (
              <article key={mail.id} className="rounded-3xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">{mail.createdAt.slice(0, 10)} · {mail.to}</p>
                <h3 className="mt-1 font-semibold">{mail.subject}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{mail.body}</p>
              </article>
            ))
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-3xl border border-dashed border-border p-8 text-sm text-muted-foreground">{text}</p>
  );
}

function ToolHeader({
  clientId,
  to,
  label,
}: {
  clientId: string;
  to:
    | "/app/analisis"
    | "/app/estrategia"
    | "/app/calendario"
    | "/app/copies"
    | "/app/scripts"
    | "/app/reports"
    | "/app/correos"
    | "/app/editor";
  label: string;
}) {
  return (
    <div className="flex justify-end">
      <Link
        to={to}
        search={{ client: clientId }}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        <Plus className="h-4 w-4" />
        {label}
      </Link>
    </div>
  );
}
