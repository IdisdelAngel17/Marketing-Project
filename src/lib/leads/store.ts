import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Lead, LeadInterest, LeadSource, LeadStatus } from "@/lib/leads/types";

function nowIso() {
  return new Date().toISOString();
}

function isSchemaGap(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "PGRST204" ||
    error.message?.includes("schema cache") === true ||
    error.message?.toLowerCase().includes("does not exist") === true
  );
}

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    company: String(row.company ?? ""),
    source: (row.source as LeadSource) || "landing",
    interest: (row.interest as LeadInterest) || "demo",
    message: String(row.message ?? ""),
    status: (row.status as LeadStatus) || "new",
    notes: String(row.notes ?? ""),
    clientId: (row.client_id as string | null) || undefined,
    createdAt: String(row.created_at ?? nowIso()),
    updatedAt: String(row.updated_at ?? nowIso()),
  };
}

export async function listLeads(): Promise<Lead[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (!error && data) return data.map((row) => mapLead(row as Record<string, unknown>));
  if (error && isSchemaGap(error)) {
    throw new Error(
      "Falta crear la tabla de leads. Ejecuta supabase/migrations/005_leads.sql en el SQL Editor.",
    );
  }
  if (error) throw new Error(error.message);
  return [];
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  extra?: { notes?: string; clientId?: string },
): Promise<Lead> {
  if (!isSupabaseConfigured()) throw new Error("Supabase no está configurado.");
  const supabase = getSupabase();
  const patch: Record<string, unknown> = {
    status,
    updated_at: nowIso(),
  };
  if (extra?.notes !== undefined) patch.notes = extra.notes;
  if (extra?.clientId) patch.client_id = extra.clientId;
  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", leadId)
    .select("*")
    .maybeSingle();
  if (error) {
    if (isSchemaGap(error)) {
      throw new Error(
        "Falta crear la tabla de leads. Ejecuta supabase/migrations/005_leads.sql en el SQL Editor.",
      );
    }
    throw new Error(error.message);
  }
  if (!data) throw new Error("Lead no encontrado.");
  return mapLead(data as Record<string, unknown>);
}

export async function updateLeadNotes(leadId: string, notes: string): Promise<Lead> {
  const current = (await listLeads()).find((l) => l.id === leadId);
  if (!current) throw new Error("Lead no encontrado.");
  return updateLeadStatus(leadId, current.status, { notes });
}
