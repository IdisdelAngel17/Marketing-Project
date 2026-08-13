import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const sendEmailSchema = z.object({
  to: z.string().trim().email("El destinatario no es un correo válido."),
  cc: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.string().email().optional()),
  subject: z.string().trim().min(3, "El asunto es demasiado corto."),
  html: z.string().trim().min(1, "El mensaje no puede ir vacío."),
  replyTo: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.string().email().optional()),
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

function textToHtml(text: string) {
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;line-height:1.6">${p.replaceAll("\n", "<br/>")}</p>`)
    .join("");
  return `<div style="font-family:DM Sans,Arial,sans-serif;color:#1f2937;font-size:15px">${paragraphs}</div>`;
}

export const getMailConfig = createServerFn({ method: "GET" }).handler(async () => {
  const configured = Boolean(env("RESEND_API_KEY", "VITE_RESEND_API_KEY"));
  return {
    configured,
    from:
      env("RESEND_FROM", "VITE_RESEND_FROM") ||
      "Community Manager IA <beth.t@example.com>",
  };
});

export const sendResendEmail = createServerFn({ method: "POST" })
  .validator(sendEmailSchema)
  .handler(async ({ data }) => {
    const apiKey = env("RESEND_API_KEY", "VITE_RESEND_API_KEY");
    if (!apiKey) {
      throw new Error(
        "Falta VITE_RESEND_API_KEY. Agrégala en .env y reinicia el servidor.",
      );
    }

    const from =
      env("RESEND_FROM", "VITE_RESEND_FROM") ||
      "Community Manager IA <beth.t@example.com>";
    const html = data.html.includes("<") ? data.html : textToHtml(data.html);

    const payload: Record<string, unknown> = {
      from,
      to: [data.to],
      subject: data.subject,
      html,
      text: data.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    };
    if (data.cc) payload.cc = [data.cc];
    if (data.replyTo) payload.reply_to = data.replyTo;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as { id?: string; message?: string; name?: string };
    if (!response.ok) {
      throw new Error(json.message || "Resend no pudo enviar el correo.");
    }

    return { id: json.id || "" };
  });
