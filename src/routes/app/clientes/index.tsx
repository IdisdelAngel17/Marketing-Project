import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, Loader2, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { createClient, initials, listClients } from "@/lib/crm/store";
import { STATUS_LABELS, type Client, type ClientStatus } from "@/lib/crm/types";
import { NETWORK_LABELS } from "@/lib/types/studio";

export const Route = createFileRoute("/app/clientes/")({
  head: () => ({
    meta: [{ title: "Clientes | Community Manager IA" }],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ClientStatus>("active");

  async function reload() {
    if (!user) return;
    const rows = await listClients(user.id);
    setClients(rows);
  }

  useEffect(() => {
    void reload().catch(() => setClients([]));
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.brand, c.industry, c.email, c.contactName].join(" ").toLowerCase().includes(q),
    );
  }, [clients, query]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const data = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const created = await createClient(user.id, {
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
      toast.success("Cliente agregado");
      setOpen(false);
      await reload();
      void navigate({ to: "/app/clientes/$clientId", params: { clientId: created.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Clientes"
      description="CRM de marcas: redes, análisis, estrategia, calendario, copies, guiones y reportes en un solo perfil."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar cliente, marca o contacto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button className="rounded-full" onClick={() => setOpen(true)}>
          <Plus />
          Agregar cliente
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">
            {clients.length === 0 ? "Aún no hay clientes" : "Sin coincidencias"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {clients.length === 0
              ? "Crea el primero y agrupa ahí redes, análisis, estrategia, calendario, copies, guiones y reportes."
              : "Prueba con otro nombre, marca o contacto."}
          </p>
          {clients.length === 0 ? (
            <Button className="mt-5 rounded-full" onClick={() => setOpen(true)}>
              <Plus />
              Nuevo cliente
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => (
            <Link
              key={client.id}
              to="/app/clientes/$clientId"
              params={{ clientId: client.id }}
              className="rounded-3xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/40 font-semibold text-primary-foreground">
                      {initials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{client.name}</h2>
                    <p className="text-xs text-muted-foreground">{client.brand || client.industry || "Sin rubro"}</p>
                  </div>
                </div>
                <Badge variant="secondary">{STATUS_LABELS[client.status]}</Badge>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
                {client.notes || client.contactName || client.email || "Sin notas todavía."}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {client.networks.length ? (
                  client.networks.map((n) => (
                    <Badge key={n.id} variant="outline">
                      {NETWORK_LABELS[n.network]}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Sin redes cargadas</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
            <DialogDescription>Ficha CRM. Luego le agregas redes y herramientas.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre / marca</Label>
              <Input id="name" name="name" required placeholder="Ej. Clínica Norte" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">Nombre comercial</Label>
                <Input id="brand" name="brand" placeholder="Cómo aparece en redes" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industria</Label>
                <Input id="industry" name="industry" placeholder="Ej. salud, foodie" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contacto</Label>
                <Input id="contactName" name="contactName" placeholder="Persona responsable" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Sitio web</Label>
                <Input id="website" name="website" placeholder="https://" />
              </div>
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
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" placeholder="Contexto, tono, objetivos…" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading} className="rounded-full">
                {loading ? <Loader2 className="animate-spin" /> : <Plus />}
                Guardar cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
