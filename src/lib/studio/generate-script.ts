import type {
  GeneratedScript,
  ScriptRequest,
  ScriptScene,
  VideoDuration,
} from "@/lib/types/studio";
import { FORMAT_LABELS, NETWORK_LABELS } from "@/lib/types/studio";

function slugId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function timeline(duration: VideoDuration): string[] {
  switch (duration) {
    case "15":
      return ["0-3s", "3-8s", "8-12s", "12-15s"];
    case "30":
      return ["0-4s", "4-12s", "12-22s", "22-30s"];
    case "60":
      return ["0-5s", "5-20s", "20-45s", "45-60s"];
    case "90":
      return ["0-6s", "6-30s", "30-70s", "70-90s"];
  }
}

function scenePack(req: ScriptRequest, times: string[]): ScriptScene[] {
  const topic = req.topic;
  const brand = req.brand;
  const audience = req.audience || "tu audiencia";

  return [
    {
      time: times[0]!,
      visual: "Primer plano dinámico + texto grande en pantalla. Corte rápido.",
      voiceover: `¿Y si ${topic.toLowerCase()} fuera más simple de lo que crees?`,
      onScreenText: "Mira esto",
    },
    {
      time: times[1]!,
      visual: "B-roll del producto/servicio o demos en pantalla. Ritmo constante.",
      voiceover: `Para ${audience}, el problema suele ser el mismo: demasiado ruido y poca claridad.`,
      onScreenText: "El problema real",
    },
    {
      time: times[2]!,
      visual: `Mostrar el método de ${brand} en 2-3 pasos visuales.`,
      voiceover: `En ${brand} lo resolvemos así: diagnóstico rápido, mensaje claro y una acción concreta.`,
      onScreenText: "Cómo lo hacemos",
    },
    {
      time: times[3]!,
      visual: "Cierre a cámara + logo + CTA visible.",
      voiceover: req.cta.trim() || `Si quieres aplicar esto hoy, síguenos y escríbenos.`,
      onScreenText: req.cta.trim() || "Empieza hoy",
    },
  ];
}

export function generateVideoScript(req: ScriptRequest): GeneratedScript {
  const times = timeline(req.duration);
  const scenes = scenePack(req, times);
  const formatLabel = FORMAT_LABELS[req.format];

  return {
    id: slugId("script"),
    title: `${req.topic} · ${formatLabel} ${req.duration}s`,
    hook: scenes[0]!.voiceover,
    scenes,
    cta: req.cta.trim() || "Síguenos y escríbenos para el siguiente paso.",
    caption: `${req.topic} en ${formatLabel}.\n\nHecho para ${req.audience || "tu audiencia"} con el tono ${req.tone} de ${req.brand}.\n\n${req.cta.trim() || "¿Lo aplicamos juntos?"}`,
    hashtags: [
      `#${req.brand.replace(/\s+/g, "")}`,
      `#${formatLabel.replace(/\s+/g, "")}`,
      `#${req.goal}`,
      "#guion",
      "#video",
      `#${NETWORK_LABELS.instagram}`,
    ].map((h) => h.replace(/\s+/g, "")),
  };
}
