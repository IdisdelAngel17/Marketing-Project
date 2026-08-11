import type { CopyRequest, GeneratedCopy, Tone, CopyGoal } from "@/lib/types/studio";
import { NETWORK_LABELS } from "@/lib/types/studio";

const hooksByTone: Record<Tone, string[]> = {
  cercano: [
    "Te cuento algo que me pasó esta semana…",
    "Si esto te suena familiar, quédate.",
    "Hablemos claro, sin rodeos.",
  ],
  profesional: [
    "Dato clave para tu estrategia esta semana:",
    "Lo que está funcionando ahora en el mercado:",
    "Una práctica que equipos top ya aplican:",
  ],
  inspirador: [
    "Hoy puede ser el día en que cambias el ritmo.",
    "Pequeños pasos. Resultados grandes.",
    "Tu próxima versión empieza con una decisión.",
  ],
  directo: [
    "Haz esto hoy. No mañana.",
    "Si quieres resultados, empieza aquí:",
    "Deja de adivinar. Usa este método:",
  ],
  jugueton: [
    "Plot twist: esto es más fácil de lo que crees.",
    "¿Listo para el tip que nadie te contó?",
    "Spoiler: tu feed te lo va a agradecer.",
  ],
};

const closingsByGoal: Record<CopyGoal, string[]> = {
  alcance: [
    "Compártelo con alguien que lo necesite hoy.",
    "Guárdalo y mándalo a tu equipo.",
  ],
  engagement: [
    "Cuéntame en comentarios: ¿tú qué harías?",
    "Responde con un emoji si te pasó lo mismo.",
  ],
  leads: [
    "Escríbenos y te mandamos la guía completa.",
    "Agenda una llamada corta y lo vemos juntos.",
  ],
  ventas: [
    "Aprovecha la oferta de esta semana.",
    "Reserva tu lugar antes de que se agote.",
  ],
  comunidad: [
    "Únete a la conversación. Aquí cabemos todos.",
    "Etiqueta a la persona con la que quieres crecer.",
  ],
};

function pick<T>(items: T[], seed: number): T {
  return items[seed % items.length]!;
}

function slugId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function cleanKeywords(raw?: string) {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,#\s]+/)
    .map((k) => k.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 6);
}

function buildHashtags(req: CopyRequest) {
  const base = [
    req.brand.replace(/\s+/g, ""),
    NETWORK_LABELS[req.network].replace(/\s+/g, ""),
    req.goal,
    "contenido",
    "marketing",
  ];
  const extra = cleanKeywords(req.keywords);
  return [...new Set([...extra, ...base])]
    .filter(Boolean)
    .slice(0, 8)
    .map((h) => `#${h.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]/g, "")}`);
}

function bodyVariant(req: CopyRequest, index: number): string {
  const audience = req.audience || "tu audiencia";
  const topic = req.topic;
  const brand = req.brand;

  const variants = [
    `${topic}.\n\nEn ${brand} lo trabajamos pensando en ${audience}: mensaje claro, valor real y una invitación a actuar.\n\nPorque el contenido que conecta no improvisa: guía, acompaña y convierte.`,
    `Para ${audience} que buscan avanzar con ${topic.toLowerCase()}:\n\n1) Empieza por el problema real.\n2) Muestra la solución con prueba concreta.\n3) Cierra con una acción simple.\n\nAsí construimos presencia de marca en ${NETWORK_LABELS[req.network]} con ${brand}.`,
    `${hooksByTone[req.tone][(index + 1) % 3]}\n\n${topic}\n\nSi eres parte de ${audience}, esto te ahorra tiempo y te acerca al objetivo de ${req.goal}.\n\n${brand} lo resume así: menos ruido, más claridad.`,
  ];

  return variants[index % variants.length]!;
}

export function generatePostCopies(req: CopyRequest): GeneratedCopy[] {
  const seed = req.topic.length + req.brand.length + req.network.length;
  const hashtags = buildHashtags(req);
  const ctaFallback = req.cta.trim() || pick(closingsByGoal[req.goal], seed);

  return [0, 1, 2].map((i) => {
    const hook = pick(hooksByTone[req.tone], seed + i);
    const closing = req.cta.trim() || pick(closingsByGoal[req.goal], seed + i + 1);
    const body = `${hook}\n\n${bodyVariant(req, i)}\n\n${closing}`;

    return {
      id: slugId("copy"),
      headline:
        i === 0
          ? `${req.topic} — versión gancho`
          : i === 1
            ? `${req.topic} — versión valor`
            : `${req.topic} — versión conversión`,
      body,
      hashtags,
      cta: ctaFallback,
      notes:
        i === 0
          ? "Ideal para abrir el feed y detener el scroll."
          : i === 1
            ? "Enfocada en utilidad y credibilidad de marca."
            : "Pensada para empujar la acción final (CTA).",
    };
  });
}
