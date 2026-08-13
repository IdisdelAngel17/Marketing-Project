import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const transcribeSchema = z.object({
  filename: z.string(),
  mime: z.string(),
  audioBase64: z.string().min(20),
  language: z.string().optional(),
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

export const transcribeAudio = createServerFn({ method: "POST" })
  .validator(transcribeSchema)
  .handler(async ({ data }) => {
    const apiKey = env("OPENAI_API_KEY", "VITE_OPENAI_API_KEY");
    if (!apiKey) {
      return {
        usedWhisper: false as const,
        words: [] as { start: number; end: number; text: string }[],
        text: "",
      };
    }

    const binary = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: data.mime || "audio/webm" });
    const form = new FormData();
    form.append("file", blob, data.filename || "audio.webm");
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "word");
    if (data.language) form.append("language", data.language);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || "Whisper no pudo transcribir el audio.");
    }

    const json = (await response.json()) as {
      text?: string;
      words?: { word?: string; start?: number; end?: number }[];
      segments?: { start?: number; end?: number; text?: string }[];
    };

    const words =
      json.words?.map((w) => ({
        text: String(w.word || "").trim(),
        start: Number(w.start || 0),
        end: Number(w.end || 0),
      })).filter((w) => w.text) ??
      json.segments?.flatMap((seg) => {
        const parts = String(seg.text || "").trim().split(/\s+/).filter(Boolean);
        const start = Number(seg.start || 0);
        const end = Number(seg.end || start + 1);
        const step = parts.length ? (end - start) / parts.length : 0;
        return parts.map((text, i) => ({
          text,
          start: start + i * step,
          end: start + (i + 1) * step,
        }));
      }) ??
      [];

    return {
      usedWhisper: true as const,
      words,
      text: json.text || "",
    };
  });
