import type { CaptionCue, VideoFeedback, ZoomCut } from "@/lib/editor/types";

export function analyzeEditedVideo(input: {
  duration: number;
  captions: CaptionCue[];
  zooms: ZoomCut[];
  topic?: string;
}): VideoFeedback {
  const { duration, captions, zooms, topic } = input;
  const theme = topic?.trim() || "tu marca";
  const captionChars = captions.reduce((acc, c) => acc + c.text.replace(/\s+/g, " ").length, 0);
  const readingSpeed = duration ? Number((captionChars / duration).toFixed(1)) : 0;
  const firstCaption = captions[0];
  const hookWindow =
    firstCaption && firstCaption.start <= 1.5
      ? "El subtítulo entra en el hook (0–1.5s)."
      : "El primer subtítulo llega tarde para retener scroll.";

  let score = 58;
  if (duration >= 8 && duration <= 45) score += 10;
  else if (duration > 60) score -= 8;
  if (captions.length >= 3) score += 8;
  if (firstCaption && firstCaption.start <= 1.5) score += 8;
  if (readingSpeed >= 8 && readingSpeed <= 18) score += 6;
  else score -= 6;
  if (zooms.length >= 1 && zooms.length <= 4) score += 8;
  if (zooms.length > 6) score -= 8;
  score = Math.max(35, Math.min(96, score));

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (captions.length) {
    strengths.push(`Hay ${captions.length} subtítulos sincronizados: el video se entiende sin audio.`);
  } else {
    improvements.push("Agrega subtítulos automáticos. En Reels/TikTok más de la mitad se ve en silencio.");
  }

  if (firstCaption && firstCaption.start <= 1.5) {
    strengths.push("El texto aparece al inicio: ayuda a frenar el scroll.");
  } else {
    improvements.push("Mueve el primer subtítulo al segundo 0–1 con un hook de 4–7 palabras.");
  }

  if (zooms.length) {
    strengths.push(`Usaste ${zooms.length} corte(s) de zoom para enfatizar momentos.`);
  } else {
    improvements.push("Agrega un zoom in en el hook y un zoom out al CTA para dar ritmo.");
  }

  if (duration > 45) {
    improvements.push("Está largo para feed. Recorta a 15–30s o divide en una serie.");
  } else if (duration < 7) {
    improvements.push("Está muy corto: deja 1 idea + 1 prueba + CTA.");
  } else {
    strengths.push("La duración encaja bien con formatos cortos.");
  }

  if (readingSpeed > 20) {
    improvements.push("Los subtítulos van muy rápido. Baja a 2 líneas y 6–10 palabras por toma.");
  } else if (readingSpeed > 0 && readingSpeed < 7) {
    improvements.push("Hay poco texto en pantalla. Cubre las frases clave, no solo el cierre.");
  }

  const nextVideos = [
    `Misma idea de ${theme}, pero con un zoom in al segundo 1 y CTA verbal + escrito.`,
    "Versión 15s: solo hook + prueba + pregunta en comentarios.",
    "Versión carrusel/video: 3 errores + 1 corrección, con tipografía distinta por escena.",
    "Graba un follow-up respondiendo el comentario más repetido de este corte.",
  ];

  return {
    score,
    summary:
      score >= 80
        ? "Corte sólido para publicar. Ajusta un detalle de ritmo y úsalo como plantilla."
        : score >= 65
          ? "Va bien. Con un hook más temprano y menos texto por toma sube el retención."
          : "La base está. Prioriza subtítulos en el primer segundo y 1–2 zooms, no más.",
    strengths,
    improvements,
    nextVideos,
    metrics: {
      duration: Number(duration.toFixed(1)),
      captions: captions.length,
      zooms: zooms.length,
      readingSpeed,
      hookWindow,
    },
  };
}
