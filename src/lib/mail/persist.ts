import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SavedMail } from "@/lib/mail/types";

const MAILS_KEY = "cmia.mails.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readLocal(): SavedMail[] {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(MAILS_KEY) || "[]") as SavedMail[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(value: SavedMail[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(MAILS_KEY, JSON.stringify(value));
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

export async function saveSentMail(mail: SavedMail) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase.from("client_mails").insert({
      id: mail.id,
      user_id: mail.userId,
      client_id: mail.clientId || null,
      client_name: mail.clientName || "",
      to_email: mail.to,
      cc: mail.cc || "",
      subject: mail.subject,
      body: mail.body,
      template: mail.template,
      status: mail.status,
      resend_id: mail.resendId || "",
      error: mail.error || "",
    });
    if (!error) return mail;
    if (!isSchemaGap(error)) throw new Error(error.message);
  }

  writeLocal([mail, ...readLocal()].slice(0, 80));
  return mail;
}

export async function listSentMails(userId: string, clientId?: string): Promise<SavedMail[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    let query = supabase
      .from("client_mails")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40);
    if (clientId) query = query.eq("client_id", clientId);
    const { data, error } = await query;
    if (!error && data) {
      return data.map((row) => ({
        id: row.id as string,
        userId: row.user_id as string,
        clientId: (row.client_id as string | null) ?? undefined,
        clientName: (row.client_name as string | null) ?? undefined,
        to: row.to_email as string,
        cc: (row.cc as string | null) || undefined,
        subject: row.subject as string,
        body: row.body as string,
        template: row.template as SavedMail["template"],
        status: row.status as SavedMail["status"],
        resendId: (row.resend_id as string | null) || undefined,
        error: (row.error as string | null) || undefined,
        createdAt: row.created_at as string,
      }));
    }
    if (error && !isSchemaGap(error)) throw new Error(error.message);
  }

  return readLocal().filter(
    (m) => m.userId === userId && (!clientId || m.clientId === clientId),
  );
}
