import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Search, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { LeadForm } from "@/components/leads/lead-form";
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
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/crm/store";
import { listLeads, updateLeadStatus } from "@/lib/leads/store";
import {
  LEAD_INTERESTS,
  LEAD_SOURCES,
  LEAD_STATUSES,
  type Lead,
  type LeadStatus,
} from "@/lib/leads/types";

export const Route = createFileRoute("/app/leads")({
  head: () => ({
    meta: [{ title: "Leads | Community Manager IA" }],
  }),
  component: LeadsPage,
});

function statusVariant(status: LeadStatus) {
  if (status === "won") return "secondary" as const;
  if (status === "lost") return "destructive" as const;
  if (status === "qualified") return "default" as const;
  return "outline" as const;
}

function LeadsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [converting, setConverting] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  async function reload() {
    const rows = await listLeads();
    setLeads(rows);
    setNotesDraft(Object.fromEntries(rows.map((l) => [l.id, l.notes])));
  }

  useEffect(() => {
    void reload().catch((err) => {
      setLeads([]);
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar los leads");
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (filter !== "all" && lead.status !== filter) return false;
      if (!q) return true;
      return [lead.name, lead.email, lead.company, lead.phone, lead.message]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [leads, query, filter]);

  const counts = useMemo(
    () => ({
      all: leads.length,
      new: leads.filter((l) => l.status === "new").length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      qualified: leads.filter((l) => l.status === "qualified").length,
      won: leads.filter((l) => l.status === "won").length,
    }),
    [leads],
  );

  async function changeStatus(lead: Lead, status: LeadStatus) {
    try {
      await updateLeadStatus(lead.id, status, { notes: notesDraft[lead.id] ?? lead.notes });
      toast.success(`Lead marcado como ${LEAD_STATUSES[status].toLowerCase()}`);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar");
    }
  }

  async function convertToClient(lead: Lead) {
    if (!user) return;
    setConverting(lead.id);
    try {
      const client = await createClient(user.id, {
        name: lead.company || lead.name,
        brand: lead.company || lead.name,
        contactName: lead.name,
        email: lead.email,
        phone: lead.phone,
        notes: [lead.message, lead.notes].filter(Boolean).join("\n\n"),
        industry: LEAD_INTERESTS[lead.interest],
      });
      await updateLeadStatus(lead.id, "won", { clientId: client.id, notes: notesDraft[lead.id] ?? lead.notes });
      toast.success("Lead convertido en cliente");
      void navigate({ to: "/app/clientes/$clientId", params: { clientId: client.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo convertir");
    } finally {
      setConverting(null);
    }
  }

  return (
    <AppShell
      title="Leads"
      description="Captura solicitudes de la landing y síguelas hasta convertirlas en clientes."
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total", value: counts.all },
          { label: "Nuevos", value: counts.new },
          { label: "Contactados", value: counts.contacted },
          { label: "Calificados", value: counts.qualified },
          { label: "Convertidos", value: counts.won },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <section className="h-fit space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div>
            <h2 className="font-semibold">Registrar lead</h2>
            <p className="text-sm text-muted-foreground">
              Úsalo para cargas manuales o pruebas. El público también puede enviarlo desde la landing.
            </p>
          </div>
          <LeadForm compact defaultSource="other" onCreated={() => void reload()} />
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar nombre, correo o marca"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as LeadStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(LEAD_STATUSES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border p-10 text-sm text-muted-foreground">
              Aún no hay leads. Comparte el formulario de la landing o registra uno aquí.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((lead) => (
                <article key={lead.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{lead.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {lead.email}
                        {lead.phone ? ` · ${lead.phone}` : ""}
                        {lead.company ? ` · ${lead.company}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {LEAD_SOURCES[lead.source]} · {LEAD_INTERESTS[lead.interest]} ·{" "}
                        {lead.createdAt.slice(0, 10)}
                      </p>
                    </div>
                    <Badge variant={statusVariant(lead.status)}>{LEAD_STATUSES[lead.status]}</Badge>
                  </div>
                  {lead.message ? (
                    <p className="mt-3 text-sm text-muted-foreground">{lead.message}</p>
                  ) : null}
                  <div className="mt-4 space-y-2">
                    <Label htmlFor={`notes-${lead.id}`}>Notas internas</Label>
                    <Textarea
                      id={`notes-${lead.id}`}
                      className="min-h-16"
                      value={notesDraft[lead.id] ?? ""}
                      onChange={(e) =>
                        setNotesDraft((prev) => ({ ...prev, [lead.id]: e.target.value }))
                      }
                      placeholder="Seguimiento, siguiente paso…"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Select
                      value={lead.status}
                      onValueChange={(v) => void changeStatus(lead, v as LeadStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LEAD_STATUSES).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      disabled={converting === lead.id || lead.status === "won"}
                      onClick={() => void convertToClient(lead)}
                    >
                      {converting === lead.id ? <Loader2 className="animate-spin" /> : <UserPlus />}
                      Convertir a cliente
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
