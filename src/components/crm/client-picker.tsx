import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listClients } from "@/lib/crm/store";
import type { Client } from "@/lib/crm/types";
import { useAuth } from "@/lib/auth/auth-context";

export function useAgencyClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (!user) return;
    void listClients(user.id).then(setClients).catch(() => setClients([]));
  }, [user]);

  return { clients, selected: (id?: string) => clients.find((c) => c.id === id) };
}

export function ClientPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (clientId: string | undefined) => void;
}) {
  const { clients } = useAgencyClients();

  return (
    <div className="space-y-2">
      <Label>Cliente del CRM</Label>
      <Select
        value={value || "none"}
        onValueChange={(v) => onChange(v === "none" ? undefined : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sin cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin cliente</SelectItem>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {clients.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aún no hay clientes.{" "}
          <Link to="/app/clientes" className="font-medium underline-offset-4 hover:underline">
            Agrégalos en el CRM
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}

export function ClientWorkBanner({ client }: { client?: Client | null }) {
  if (!client) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-primary/40 bg-primary/15 px-5 py-3">
      <div className="flex items-center gap-2 text-sm">
        <Building2 className="h-4 w-4" />
        <span>
          Trabajando para <strong>{client.name}</strong>
          {client.brand && client.brand !== client.name ? ` · ${client.brand}` : ""}
        </span>
      </div>
      <Link
        to="/app/clientes/$clientId"
        params={{ clientId: client.id }}
        className="text-sm font-medium underline-offset-4 hover:underline"
      >
        Ver perfil CRM
      </Link>
    </div>
  );
}
