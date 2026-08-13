import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { listSentMails } from "@/lib/mail/persist";
import {
  listSavedCopies,
  listSavedScripts,
  listWeeklyReports,
  type SavedCopy,
  type SavedScript,
} from "@/lib/studio/persist";
import type {
  ContentCalendar,
  ContentStrategy,
  ProfileAnalysis,
  SocialNetwork,
  WeeklyReport,
} from "@/lib/types/studio";
import type {
  Client,
  ClientInput,
  ClientNetwork,
  ClientWorkspace,
  SavedAnalysis,
  SavedCalendar,
  SavedStrategy,
} from "@/lib/crm/types";

const CLIENTS_KEY = "cmia.clients.v2";
const ANALYSES_KEY = "cmia.client-analyses.v1";
const STRATEGIES_KEY = "cmia.client-strategies.v1";
const CALENDARS_KEY = "cmia.client-calendars.v1";

function slugId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readLocal<T>(key: string): T[] {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]") as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, value: T[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function isSchemaGap(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "PGRST204" ||
    error.message?.includes("schema cache") === true ||
    error.message?.includes("client_id") === true ||
    error.message?.toLowerCase().includes("does not exist") === true
  );
}

function nowIso() {
  return new Date().toISOString();
}

function mapClientRow(row: Record<string, unknown>, networks: ClientNetwork[] = []): Client {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name ?? ""),
    brand: String(row.brand ?? ""),
    industry: String(row.industry ?? ""),
    contactName: String(row.contact_name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    website: String(row.website ?? ""),
    notes: String(row.notes ?? ""),
    status: (row.status as Client["status"]) || "active",
    createdAt: String(row.created_at ?? nowIso()),
    updatedAt: String(row.updated_at ?? nowIso()),
    networks,
  };
}

function mapNetworkRow(row: Record<string, unknown>): ClientNetwork {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    network: row.network as SocialNetwork,
    handle: String(row.handle ?? ""),
    url: String(row.url ?? ""),
    createdAt: String(row.created_at ?? nowIso()),
  };
}

export async function listClients(userId: string): Promise<Client[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (!error && data) {
      const ids = data.map((r) => r.id);
      const { data: nets } = ids.length
        ? await supabase.from("client_networks").select("*").in("client_id", ids)
        : { data: [] as never[] };
      const byClient = new Map<string, ClientNetwork[]>();
      for (const row of nets ?? []) {
        const mapped = mapNetworkRow(row as Record<string, unknown>);
        const list = byClient.get(mapped.clientId) ?? [];
        list.push(mapped);
        byClient.set(mapped.clientId, list);
      }
      return data.map((row) => mapClientRow(row as Record<string, unknown>, byClient.get(row.id) ?? []));
    }
    if (error && !isSchemaGap(error)) throw new Error(error.message);
  }

  return readLocal<Client>(CLIENTS_KEY)
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getClient(userId: string, clientId: string): Promise<Client | null> {
  const all = await listClients(userId);
  return all.find((c) => c.id === clientId) ?? null;
}

export async function createClient(userId: string, input: ClientInput): Promise<Client> {
  if (!input.name.trim()) throw new Error("El nombre del cliente es obligatorio.");
  const stamp = nowIso();
  const client: Client = {
    id: slugId("cli"),
    userId,
    name: input.name.trim(),
    brand: input.brand?.trim() || input.name.trim(),
    industry: input.industry?.trim() || "",
    contactName: input.contactName?.trim() || "",
    email: input.email?.trim() || "",
    phone: input.phone?.trim() || "",
    website: input.website?.trim() || "",
    notes: input.notes?.trim() || "",
    status: input.status ?? "active",
    createdAt: stamp,
    updatedAt: stamp,
    networks: [],
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase.from("clients").insert({
      id: client.id,
      user_id: userId,
      name: client.name,
      brand: client.brand,
      industry: client.industry,
      contact_name: client.contactName,
      email: client.email,
      phone: client.phone,
      website: client.website,
      notes: client.notes,
      status: client.status,
    });
    if (!error) return client;
    if (!isSchemaGap(error)) throw new Error(error.message);
  }

  writeLocal(CLIENTS_KEY, [client, ...readLocal<Client>(CLIENTS_KEY)]);
  return client;
}

export async function updateClient(userId: string, clientId: string, input: ClientInput): Promise<Client> {
  const current = await getClient(userId, clientId);
  if (!current) throw new Error("Cliente no encontrado.");
  const next: Client = {
    ...current,
    name: input.name.trim() || current.name,
    brand: input.brand?.trim() ?? current.brand,
    industry: input.industry?.trim() ?? current.industry,
    contactName: input.contactName?.trim() ?? current.contactName,
    email: input.email?.trim() ?? current.email,
    phone: input.phone?.trim() ?? current.phone,
    website: input.website?.trim() ?? current.website,
    notes: input.notes?.trim() ?? current.notes,
    status: input.status ?? current.status,
    updatedAt: nowIso(),
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("clients")
      .update({
        name: next.name,
        brand: next.brand,
        industry: next.industry,
        contact_name: next.contactName,
        email: next.email,
        phone: next.phone,
        website: next.website,
        notes: next.notes,
        status: next.status,
        updated_at: next.updatedAt,
      })
      .eq("id", clientId)
      .eq("user_id", userId);
    if (!error) return next;
    if (!isSchemaGap(error)) throw new Error(error.message);
  }

  writeLocal(
    CLIENTS_KEY,
    readLocal<Client>(CLIENTS_KEY).map((c) => (c.id === clientId ? next : c)),
  );
  return next;
}

export async function deleteClient(userId: string, clientId: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase.from("clients").delete().eq("id", clientId).eq("user_id", userId);
    if (error && !isSchemaGap(error)) throw new Error(error.message);
  }
  writeLocal(
    CLIENTS_KEY,
    readLocal<Client>(CLIENTS_KEY).filter((c) => !(c.id === clientId && c.userId === userId)),
  );
  writeLocal(
    ANALYSES_KEY,
    readLocal<{ clientId: string }>(ANALYSES_KEY).filter((r) => r.clientId !== clientId),
  );
  writeLocal(
    STRATEGIES_KEY,
    readLocal<{ clientId: string }>(STRATEGIES_KEY).filter((r) => r.clientId !== clientId),
  );
  writeLocal(
    CALENDARS_KEY,
    readLocal<{ clientId: string }>(CALENDARS_KEY).filter((r) => r.clientId !== clientId),
  );
}

function guessNetworkUrl(network: SocialNetwork, handle: string) {
  const h = handle.replace(/^@/, "").trim();
  if (!h) return "";
  switch (network) {
    case "instagram":
      return `https://instagram.com/${h}`;
    case "tiktok":
      return `https://www.tiktok.com/@${h}`;
    case "linkedin":
      return `https://www.linkedin.com/in/${h}`;
    case "facebook":
      return `https://facebook.com/${h}`;
    case "x":
      return `https://x.com/${h}`;
    case "youtube":
      return `https://youtube.com/@${h}`;
  }
}

export async function addClientNetwork(
  userId: string,
  clientId: string,
  input: { network: SocialNetwork; handle: string; url: string },
): Promise<ClientNetwork> {
  const handle = input.handle.replace(/^@/, "").trim();
  const network: ClientNetwork = {
    id: slugId("net"),
    clientId,
    network: input.network,
    handle,
    url: input.url.trim() || guessNetworkUrl(input.network, handle),
    createdAt: nowIso(),
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase.from("client_networks").insert({
      id: network.id,
      client_id: clientId,
      user_id: userId,
      network: network.network,
      handle: network.handle,
      url: network.url,
    });
    if (!error) {
      await supabase.from("clients").update({ updated_at: nowIso() }).eq("id", clientId);
      return network;
    }
    if (!isSchemaGap(error)) throw new Error(error.message);
  }

  writeLocal(
    CLIENTS_KEY,
    readLocal<Client>(CLIENTS_KEY).map((c) =>
      c.id === clientId ? { ...c, networks: [...c.networks, network], updatedAt: nowIso() } : c,
    ),
  );
  return network;
}

export async function removeClientNetwork(userId: string, clientId: string, networkId: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("client_networks")
      .delete()
      .eq("id", networkId)
      .eq("user_id", userId);
    if (error && !isSchemaGap(error)) throw new Error(error.message);
    if (!error) return;
  }
  writeLocal(
    CLIENTS_KEY,
    readLocal<Client>(CLIENTS_KEY).map((c) =>
      c.id === clientId
        ? { ...c, networks: c.networks.filter((n) => n.id !== networkId), updatedAt: nowIso() }
        : c,
    ),
  );
}

async function insertPayload<T extends { id: string }>(
  table: string,
  key: string,
  userId: string,
  clientId: string,
  payload: T,
) {
  const row = { id: payload.id, clientId, userId, createdAt: nowIso(), payload };
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase.from(table).insert({
      id: payload.id,
      client_id: clientId,
      user_id: userId,
      payload,
    });
    if (!error) return row;
    if (!isSchemaGap(error)) throw new Error(error.message);
  }
  writeLocal(key, [row, ...readLocal<typeof row>(key)].slice(0, 40));
  return row;
}

async function listPayloads<T>(table: string, key: string, userId: string, clientId: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) {
      return data.map((row) => ({
        id: row.id as string,
        clientId: row.client_id as string,
        userId: row.user_id as string,
        createdAt: row.created_at as string,
        payload: row.payload as T,
      }));
    }
    if (error && !isSchemaGap(error)) throw new Error(error.message);
  }
  return readLocal<{
    id: string;
    clientId: string;
    userId: string;
    createdAt: string;
    payload: T;
  }>(key).filter((r) => r.userId === userId && r.clientId === clientId);
}

export async function saveClientAnalysis(userId: string, clientId: string, analysis: ProfileAnalysis) {
  const row = await insertPayload("client_analyses", ANALYSES_KEY, userId, clientId, analysis);
  return {
    id: row.id,
    clientId,
    userId,
    createdAt: row.createdAt,
    analysis: row.payload,
  } satisfies SavedAnalysis;
}

export async function saveClientStrategy(userId: string, clientId: string, strategy: ContentStrategy) {
  const row = await insertPayload("client_strategies", STRATEGIES_KEY, userId, clientId, strategy);
  return {
    id: row.id,
    clientId,
    userId,
    createdAt: row.createdAt,
    strategy: row.payload,
  } satisfies SavedStrategy;
}

export async function saveClientCalendar(userId: string, clientId: string, calendar: ContentCalendar) {
  const row = await insertPayload("client_calendars", CALENDARS_KEY, userId, clientId, calendar);
  return {
    id: row.id,
    clientId,
    userId,
    createdAt: row.createdAt,
    calendar: row.payload,
  } satisfies SavedCalendar;
}

export async function getClientWorkspace(userId: string, clientId: string): Promise<ClientWorkspace | null> {
  const client = await getClient(userId, clientId);
  if (!client) return null;

  const [analysisRows, strategyRows, calendarRows, copies, scripts, reports, mails] = await Promise.all([
    listPayloads<ProfileAnalysis>("client_analyses", ANALYSES_KEY, userId, clientId),
    listPayloads<ContentStrategy>("client_strategies", STRATEGIES_KEY, userId, clientId),
    listPayloads<ContentCalendar>("client_calendars", CALENDARS_KEY, userId, clientId),
    listSavedCopies(userId, clientId),
    listSavedScripts(userId, clientId),
    listWeeklyReports(userId, clientId),
    listSentMails(userId, clientId),
  ]);

  return {
    client,
    analyses: analysisRows.map((r) => ({
      id: r.id,
      clientId: r.clientId,
      userId: r.userId,
      createdAt: r.createdAt,
      analysis: r.payload,
    })),
    strategies: strategyRows.map((r) => ({
      id: r.id,
      clientId: r.clientId,
      userId: r.userId,
      createdAt: r.createdAt,
      strategy: r.payload,
    })),
    calendars: calendarRows.map((r) => ({
      id: r.id,
      clientId: r.clientId,
      userId: r.userId,
      createdAt: r.createdAt,
      calendar: r.payload,
    })),
    copies,
    scripts,
    reports,
    mails,
  };
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export type { SavedCopy, SavedScript, WeeklyReport };
