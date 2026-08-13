import type { CaptionCue } from "@/lib/editor/types";

function slugId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function decodeVideoAudio(file: File) {
  const ctx = new AudioContext();
  try {
    const buffer = await file.arrayBuffer();
    const audio = await ctx.decodeAudioData(buffer.slice(0));
    await ctx.close();
    return audio;
  } catch {
    await ctx.close().catch(() => undefined);
    throw new Error(
      "Este archivo no dejó extraer audio en el navegador. Prueba MP4/WebM con pista de audio, o agrega subtítulos a mano.",
    );
  }
}

export function detectSpeechSegments(audio: AudioBuffer, minDuration = 0.7) {
  const channel = audio.getChannelData(0);
  const sampleRate = audio.sampleRate;
  const windowSize = Math.floor(sampleRate * 0.05);
  const energies: number[] = [];

  for (let i = 0; i < channel.length; i += windowSize) {
    let sum = 0;
    const end = Math.min(channel.length, i + windowSize);
    for (let j = i; j < end; j++) sum += channel[j]! * channel[j]!;
    energies.push(Math.sqrt(sum / Math.max(1, end - i)));
  }

  const sorted = [...energies].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length * 0.55)] || 0.02;
  const threshold = Math.max(0.012, median * 1.35);

  const segments: { start: number; end: number }[] = [];
  let open: number | null = null;

  energies.forEach((energy, index) => {
    const t = (index * windowSize) / sampleRate;
    if (energy >= threshold) {
      if (open === null) open = t;
    } else if (open !== null) {
      const end = t;
      if (end - open >= minDuration) segments.push({ start: open, end });
      open = null;
    }
  });

  if (open !== null) {
    const end = audio.duration;
    if (end - open >= minDuration) segments.push({ start: open, end });
  }

  if (!segments.length) {
    const chunk = Math.min(3.2, Math.max(1.8, audio.duration / 4));
    for (let t = 0; t < audio.duration; t += chunk) {
      segments.push({ start: t, end: Math.min(audio.duration, t + chunk - 0.12) });
    }
  }

  return segments.map((seg) => ({
    start: Number(seg.start.toFixed(2)),
    end: Number(Math.min(audio.duration, seg.end).toFixed(2)),
  }));
}

const HOOKS = [
  "Mira esto antes de publicar",
  "El error que más se repite",
  "Hazlo así y cambia el resultado",
  "Esto es lo que sí funciona",
  "Atención: el primer segundo cuenta",
];

const BODIES = [
  "Habla directo a cámara y di una sola idea.",
  "Muestra el antes y el después en un corte rápido.",
  "Explica el beneficio, no la herramienta.",
  "Deja una prueba visual y un número concreto.",
  "Cierra con una pregunta para comentarios.",
];

const CTAS = [
  "Síguenos para el siguiente tip",
  "Guarda este video y pruébalo hoy",
  "Comenta si lo vas a aplicar",
  "Escríbenos y lo armamos juntos",
];

export function captionsFromSegments(
  segments: { start: number; end: number }[],
  topic?: string,
): CaptionCue[] {
  const theme = topic?.trim() || "tu contenido";
  return segments.map((seg, index) => {
    let text: string;
    if (index === 0) text = HOOKS[index % HOOKS.length]!;
    else if (index === segments.length - 1) text = CTAS[index % CTAS.length]!;
    else text = `${BODIES[index % BODIES.length]} (${theme})`;
    return {
      id: slugId("cap"),
      start: seg.start,
      end: Math.max(seg.start + 0.6, seg.end),
      text,
    };
  });
}

export function captionsFromWhisper(
  words: { start: number; end: number; text: string }[],
): CaptionCue[] {
  if (!words.length) return [];
  const cues: CaptionCue[] = [];
  let bucket: { start: number; end: number; text: string[] } | null = null;

  const flush = () => {
    if (!bucket) return;
    cues.push({
      id: slugId("cap"),
      start: Number(bucket.start.toFixed(2)),
      end: Number(bucket.end.toFixed(2)),
      text: bucket.text.join(" ").trim(),
    });
    bucket = null;
  };

  for (const word of words) {
    if (!bucket) {
      bucket = { start: word.start, end: word.end, text: [word.text] };
      continue;
    }
    const tooLong = bucket.text.join(" ").length > 42;
    const gap = word.start - bucket.end > 0.55;
    if (tooLong || gap) {
      flush();
      bucket = { start: word.start, end: word.end, text: [word.text] };
    } else {
      bucket.end = word.end;
      bucket.text.push(word.text);
    }
  }
  flush();
  return cues;
}

export async function fileToBase64(file: Blob) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
