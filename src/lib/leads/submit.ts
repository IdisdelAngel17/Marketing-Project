import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  LEAD_INTERESTS,
  LEAD_SOURCES,
  type Lead,
  type LeadInput,
  type LeadInterest,
  type LeadSource,
} from "@/lib/leads/types";

const submitSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  email: z.string().trim().email("El correo no es válido."),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.enum(["landing", "whatsapp", "instagram", "referral", "other"]).optional(),
  interest: z.enum(["estudio", "agencia", "custom", "demo", "other"]).optional(),
  message: z.string().optional(),
});

function env(...names: string[]) {
  for (const name of names) {
    try {
      if (typeof process !== "undefined" && process.env?.[name]) {
        return process.env[name]!.trim();
      }
    } catch {
      /* ignore */
    }
    try {
      const vite = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
      if (vite?.[name]) return vite[name]!.trim();
    } catch {
      /* ignore */
    }
  }
  return "";
}

function slugId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function supabaseConfig() {
  const url = env("VITE_SUPABASE_URL", "SUPABASE_URL");
  const key = env(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
  );
  if (!url || !key) {
    throw new Error("Falta configurar Supabase para guardar leads.");
  }
  return { url: url.replace(/\/$/, ""), key };
}

async function supabaseInsertLead(lead: Lead) {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/leads`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      source: lead.source,
      interest: lead.interest,
      message: lead.message,
      status: lead.status,
      notes: lead.notes,
    }),
  });

  if (response.ok) return;

  let detail = "";
  try {
    const json = (await response.json()) as { message?: string; hint?: string };
    detail = [json.message, json.hint].filter(Boolean).join(" ");
  } catch {
    detail = await response.text();
  }

  if (response.status === 404 || /does not exist|schema cache/i.test(detail)) {
    throw new Error(
      "Falta crear la tabla de leads. Ejecuta supabase/migrations/005_leads.sql en el SQL Editor.",
    );
  }
  throw new Error(detail || "No se pudo guardar el lead en Supabase.");
}

async function notifyLead(lead: LeadInput & { name: string; email: string }) {
  const apiKey = env("RESEND_API_KEY", "VITE_RESEND_API_KEY");
  const notifyTo = env("LEAD_NOTIFY_EMAIL", "VITE_LEAD_NOTIFY_EMAIL");
  if (!apiKey || !notifyTo) return;

  const from =
    env("RESEND_FROM", "VITE_RESEND_FROM") ||
    "Community Manager IA <beth.t@example.com>";
  const source = LEAD_SOURCES[(lead.source as LeadSource) || "landing"];
  const interest = LEAD_INTERESTS[(lead.interest as LeadInterest) || "demo"];

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [notifyTo],
      subject: `Nuevo lead: ${lead.name}`,
      reply_to: lead.email,
      html: `
        <div style="font-family:DM Sans,Arial,sans-serif;color:#1f2937;font-size:15px;line-height:1.6">
          <h1 style="font-size:20px;margin:0 0 12px">Nuevo lead</h1>
          <p><strong>${lead.name}</strong> · ${lead.email}</p>
          ${lead.phone ? `<p>Teléfono: ${lead.phone}</p>` : ""}
          ${lead.company ? `<p>Empresa: ${lead.company}</p>` : ""}
          <p>Origen: ${source} · Interés: ${interest}</p>
          ${lead.message ? `<p style="white-space:pre-wrap">${lead.message}</p>` : ""}
        </div>
      `,
    }),
  });
}

export const submitLead = createServerFn({ method: "POST" })
  .validator(submitSchema)
  .handler(async ({ data }) => {
    const stamp = new Date().toISOString();
    const lead: Lead = {
      id: slugId("lead"),
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || "",
      company: data.company?.trim() || "",
      source: data.source ?? "landing",
      interest: data.interest ?? "demo",
      message: data.message?.trim() || "",
      status: "new",
      notes: "",
      createdAt: stamp,
      updatedAt: stamp,
    };

    await supabaseInsertLead(lead);
    await notifyLead(lead).catch(() => undefined);
    return lead;
  });
