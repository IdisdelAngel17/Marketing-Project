import type {
  CopyGoal,
  ProfileAnalysis,
  ProfileAnalysisRequest,
  ProfileOpportunity,
  SocialNetwork,
} from "@/lib/types/studio";
import { GOAL_LABELS, NETWORK_LABELS } from "@/lib/types/studio";

export class ProfileUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileUrlError";
  }
}

function slugId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function cleanHandle(value: string) {
  return value.replace(/^@/, "").replace(/\/+$/, "").split(/[?#]/)[0] || "perfil";
}

export function parseSocialProfileUrl(raw: string): {
  network: SocialNetwork;
  handle: string;
  url: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new ProfileUrlError("Pega el link del perfil.");
  }

  let normalized = trimmed;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new ProfileUrlError("El link no es válido. Usa una URL completa del perfil.");
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const parts = parsed.pathname.split("/").filter(Boolean);

  if (host.includes("instagram.com")) {
    const handle = cleanHandle(parts[0] || "");
    if (!handle || ["p", "reel", "reels", "stories", "explore"].includes(handle)) {
      throw new ProfileUrlError("Usa el link del perfil de Instagram, no de una publicación.");
    }
    return {
      network: "instagram",
      handle,
      url: `https://instagram.com/${handle}`,
    };
  }

  if (host.includes("tiktok.com")) {
    const at = parts.find((p) => p.startsWith("@"));
    const handle = cleanHandle(at || parts[0] || "");
    if (!handle) {
      throw new ProfileUrlError("No encontramos el usuario en el link de TikTok.");
    }
    return {
      network: "tiktok",
      handle,
      url: `https://tiktok.com/@${handle}`,
    };
  }

  if (host.includes("linkedin.com")) {
    const idx = parts.findIndex((p) => p === "in" || p === "company");
    const handle = cleanHandle(idx >= 0 ? parts[idx + 1] || "" : parts[0] || "");
    if (!handle) {
      throw new ProfileUrlError("Usa un link de perfil o página de LinkedIn.");
    }
    const kind = parts[idx] === "company" ? "company" : "in";
    return {
      network: "linkedin",
      handle,
      url: `https://linkedin.com/${kind}/${handle}`,
    };
  }

  if (host.includes("facebook.com") || host.includes("fb.com")) {
    const handle = cleanHandle(parts[0] || parsed.searchParams.get("id") || "");
    if (!handle || ["watch", "share", "photo", "permalink.php"].includes(handle)) {
      throw new ProfileUrlError("Usa el link de la página o perfil de Facebook.");
    }
    return {
      network: "facebook",
      handle,
      url: `https://facebook.com/${handle}`,
    };
  }

  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    let handle = "";
    if (parts[0]?.startsWith("@")) handle = cleanHandle(parts[0]);
    else if (parts[0] === "channel" || parts[0] === "c" || parts[0] === "user") {
      handle = cleanHandle(parts[1] || "");
    }
    if (!handle) {
      throw new ProfileUrlError("Usa el link del canal de YouTube (@canal).");
    }
    return {
      network: "youtube",
      handle,
      url: `https://youtube.com/@${handle}`,
    };
  }

  if (host === "x.com" || host.includes("twitter.com")) {
    const handle = cleanHandle(parts[0] || "");
    if (!handle || ["i", "home", "intent", "share"].includes(handle)) {
      throw new ProfileUrlError("Usa el link del perfil de X.");
    }
    return {
      network: "x",
      handle,
      url: `https://x.com/${handle}`,
    };
  }

  throw new ProfileUrlError(
    "Red no reconocida. Soportamos Instagram, TikTok, LinkedIn, Facebook, YouTube y X.",
  );
}

const networkPlaybooks: Record<
  SocialNetwork,
  {
    strengths: string[];
    opportunities: Omit<ProfileOpportunity, "id">[];
    ideas: string[];
    plan: string[];
  }
> = {
  instagram: {
    strengths: [
      "Formato visual ideal para construir identidad de marca reconocible.",
      "Reels y carruseles permiten educar y entretener en el mismo feed.",
    ],
    opportunities: [
      {
        area: "Bio y propuesta de valor",
        priority: "alta",
        finding:
          "Muchos perfiles resumen mal qué ofrecen o para quién. Sin claridad, se pierde conversión desde el primer vistazo.",
        advice:
          "Reescribe la bio en 3 líneas: quién eres + para quién + resultado. Mantén un solo CTA visible.",
        action: "Actualizar bio + link en bio esta semana.",
      },
      {
        area: "Ritmo de contenido",
        priority: "alta",
        finding:
          "La irregularidad baja el alcance. Instagram premia consistencia de Reels + piezas guardables.",
        advice:
          "Define 3 pilares (educativo, prueba social, detrás de cámaras) y publica al menos 4 piezas/semana.",
        action: "Armar calendario de 14 días con 2 Reels y 2 carruseles.",
      },
      {
        area: "Hooks de los primeros 1–2s",
        priority: "media",
        finding:
          "Sin gancho fuerte, el scroll gana. Los Reels con texto inicial claro retienen mejor.",
        advice:
          "Empieza cada Reel con una promesa o pregunta concreta. Evita intros largas de marca.",
        action: "Reescribir los 5 hooks siguientes antes de grabar.",
      },
      {
        area: "CTA y captura de leads",
        priority: "rapida",
        finding:
          "Hay engagement, pero poca dirección hacia WhatsApp, formulario o agenda.",
        advice:
          "Cierra cada pieza con una acción única y medible. Repite el mismo CTA 7 días.",
        action: "Elegir 1 CTA maestro y usarlo en Stories + caption.",
      },
    ],
    ideas: [
      "Carrusel: ‘Errores que bajan tu alcance (y cómo corregirlos)’",
      "Reel: ‘En 20s, cómo mejorar tu bio’",
      "Story encuesta: ‘¿Qué contenido te sirve más?’",
    ],
    plan: [
      "Día 1–2: auditoría visual (foto, highlights, bio).",
      "Día 3–10: publicar 4 Reels y 2 carruseles de pilares.",
      "Día 11–20: probar 2 CTAs y medir mensajes/clics.",
      "Día 21–30: doblar el formato top y archivar lo flojo.",
    ],
  },
  tiktok: {
    strengths: [
      "Alto potencial de alcance orgánico con piezas cortas y tendencia.",
      "El algoritmo permite crecer sin base previa si el watch time es alto.",
    ],
    opportunities: [
      {
        area: "Retención del primer segundo",
        priority: "alta",
        finding: "Los videos que empiezan lento se cortan antes del valor.",
        advice: "Abre con conflicto, dato o resultado. El branding puede ir al segundo 3–4.",
        action: "Grabar 3 aperturas distintas del mismo tip y quedarte con la mejor.",
      },
      {
        area: "Series y recurrencia",
        priority: "alta",
        finding: "Publicar tips sueltos no construye hábito de seguimiento.",
        advice: "Crea una serie semanal con nombre fijo (ej. ‘Lunes de hooks’).",
        action: "Definir nombre de serie + 4 capítulos.",
      },
      {
        area: "Sonidos y formato nativo",
        priority: "media",
        finding: "Contenido demasiado ‘anuncio’ se siente ajeno al For You.",
        advice: "Habla a cámara, subtítulos grandes y cortes cada 1–2s en tips.",
        action: "Reformatear el próximo video a estilo nativo TikTok.",
      },
      {
        area: "Conversión fuera de la app",
        priority: "rapida",
        finding: "El tráfico se queda en likes sin pasar a lead o venta.",
        advice: "Usa CTA verbal + comentario pineado + link en bio alineados al mismo offer.",
        action: "Pinear comentario con el siguiente paso claro.",
      },
    ],
    ideas: [
      "Tip de 15s: ‘El hook que más nos funcionó esta semana’",
      "Duet/stitch educativo respondiendo objeciones",
      "Serie: ‘Antes vs después del copy’",
    ],
    plan: [
      "Semana 1: 5 videos de prueba de hooks.",
      "Semana 2: lanzar serie fija 3 veces.",
      "Semana 3: empujar el video top con variaciones.",
      "Semana 4: CTA de lead magnet y medir clics al link.",
    ],
  },
  linkedin: {
    strengths: [
      "Excelente para autoridad B2B y generación de conversaciones calificadas.",
      "Los posts largos con historia + insight generan guardados y DMs.",
    ],
    opportunities: [
      {
        area: "Posicionamiento del perfil",
        priority: "alta",
        finding: "Titular genérico reduce clics al perfil y confianza inicial.",
        advice: "Titular = rol + audiencia + resultado. Banner con prueba o CTA.",
        action: "Reescribir titular y ‘Acerca de’ en una sola narrativa.",
      },
      {
        area: "Consistencia de posts",
        priority: "alta",
        finding: "Publicar solo cuando hay anuncio de empresa frena el reach.",
        advice: "3 posts/semana: aprendizaje, caso, opinión con datos.",
        action: "Bloquear 45 min semanales para lotear contenido.",
      },
      {
        area: "Documentos y carruseles",
        priority: "media",
        finding: "Se subusa el formato documento, que suele tener alto guardado.",
        advice: "Empaqueta checklists y frameworks en PDF/carrusel nativo.",
        action: "Publicar 1 documento práctico la próxima semana.",
      },
      {
        area: "CTA de conversación",
        priority: "rapida",
        finding: "Los cierres ‘sígueme’ no mueven oportunidades comerciales.",
        advice: "Pide un comentario específico o ofrece una plantilla por DM.",
        action: "Probar CTA ‘comenta X y te mando la plantilla’.",
      },
    ],
    ideas: [
      "Post: ‘Lo que aprendimos midiendo 30 días de contenido’",
      "Documento: checklist de perfil optimizado",
      "Caso breve con métrica real (aunque sea interna/demo)",
    ],
    plan: [
      "Días 1–3: optimizar perfil y featured.",
      "Días 4–15: 6 posts (2 por pilar).",
      "Días 16–23: 1 documento + follow-up en comentarios.",
      "Días 24–30: outreach a quienes interactuaron.",
    ],
  },
  facebook: {
    strengths: [
      "Sigue siendo útil para comunidad local, grupos y remarketing.",
      "Las páginas con prueba social y respuestas rápidas convierten mejor.",
    ],
    opportunities: [
      {
        area: "Identidad de la página",
        priority: "alta",
        finding: "Portada, CTA del botón y descripción desalineados confunden.",
        advice: "Unifica mensaje: oferta principal + botón de acción (WhatsApp/agenda).",
        action: "Actualizar botón CTA y descripción corta hoy.",
      },
      {
        area: "Mezcla orgánico + comunidad",
        priority: "media",
        finding: "Solo posts de venta cansan; falta conversación.",
        advice: "Alterna utilidad, UGC/testimonios y preguntas abiertas.",
        action: "Programar 1 post de pregunta y 1 testimonio por semana.",
      },
      {
        area: "Respuesta a comentarios",
        priority: "alta",
        finding: "Comentarios sin respuesta enfrían el algoritmo y la confianza.",
        advice: "SLA de respuesta < 2 horas en horario laboral.",
        action: "Crear 5 respuestas plantilla para objeciones frecuentes.",
      },
      {
        area: "Reutilización de creativos",
        priority: "rapida",
        finding: "Se descartan piezas que podrían vivir como anuncio o remin.",
        advice: "Pasa los orgánicos top a pauta con presupuesto chico de prueba.",
        action: "Elegir 1 post top y pautarlo 3 días.",
      },
    ],
    ideas: [
      "Post local: ‘Lo que más preguntan nuestros clientes este mes’",
      "Video corto de testimonio con subtítulos",
      "Encuesta en publicación sobre el siguiente contenido",
    ],
    plan: [
      "Semana 1: limpiar página y CTA.",
      "Semana 2: ritmo 4 posts + respuestas activas.",
      "Semana 3: pauta al mejor creativo.",
      "Semana 4: revisar mensajes y optimizar oferta.",
    ],
  },
  youtube: {
    strengths: [
      "El contenido evergreen sigue trayendo tráfico meses después.",
      "Ideal para tutorials, demos y autoridad profunda.",
    ],
    opportunities: [
      {
        area: "Empaquetado del canal",
        priority: "alta",
        finding: "Banner, trailer y descripción poco claros bajan el subscribe rate.",
        advice: "Trailer de 30–45s con promesa del canal + playlist destacada.",
        action: "Actualizar descripción y sección de videos destacados.",
      },
      {
        area: "Títulos y thumbnails",
        priority: "alta",
        finding: "Sin curiosidad clara, el CTR se queda bajo aunque el video sea bueno.",
        advice: "Título con beneficio concreto + thumbnail con emoción/resultado.",
        action: "Rehacer thumbnail de los 3 videos más recientes.",
      },
      {
        area: "Retención media",
        priority: "media",
        finding: "Intros largas y falta de chapters hacen que la gente se vaya.",
        advice: "Promesa en 15s, capítulos visibles y ganchos cada minuto.",
        action: "Agregar chapters al próximo video antes de publicar.",
      },
      {
        area: "Embudo post-video",
        priority: "rapida",
        finding: "Hay views, pero el CTA final es débil o inexistente.",
        advice: "CTA verbal + tarjeta + descripción con un solo siguiente paso.",
        action: "Estandarizar bloque final de 20s con CTA fijo.",
      },
    ],
    ideas: [
      "Tutorial: ‘Cómo auditar un perfil en 10 minutos’",
      "Short derivado del mejor minuto del video largo",
      "Video lista: ‘Plantillas de guion que usamos’",
    ],
    plan: [
      "Semana 1: optimizar canal y 3 thumbnails.",
      "Semana 2: 1 video largo + 3 Shorts derivados.",
      "Semana 3: mejorar retención con chapters y cortes.",
      "Semana 4: medir CTR/suscriptores y repetir formato top.",
    ],
  },
  x: {
    strengths: [
      "Útil para pensamiento rápido, autoridad y distribución de ideas.",
      "Los hilos bien estructurados pueden atraer seguidores calificados.",
    ],
    opportunities: [
      {
        area: "Claridad del perfil",
        priority: "alta",
        finding: "Bio vaga y pin ausente desaprovechan visitas al perfil.",
        advice: "Bio con nicho + resultado. Fija un hilo o recurso estrella.",
        action: "Reescribir bio y fijar el mejor hilo.",
      },
      {
        area: "Cadencia de posts",
        priority: "media",
        finding: "Publicar de golpe y desaparecer mata el alcance.",
        advice: "2–4 posts/día con mezcla de insight, pregunta y prueba.",
        action: "Preparar un lote de 10 posts para 5 días.",
      },
      {
        area: "Hilos con estructura",
        priority: "alta",
        finding: "Ideas buenas se diluyen sin formato de hilo.",
        advice: "Hook → 5–7 puntos → ejemplo → CTA. Un hilo semanal basta.",
        action: "Publicar 1 hilo educativo esta semana.",
      },
      {
        area: "Conversación real",
        priority: "rapida",
        finding: "Solo broadcasting sin replies limita distribución.",
        advice: "Responde 10 cuentas del nicho al día con valor, no spam.",
        action: "Bloquear 20 min diarios de engagement dirigido.",
      },
    ],
    ideas: [
      "Hilo: ‘Checklist de perfil que convierte’",
      "Post de dato + opinión controvertida suave",
      "Mini caso: ‘Qué cambió cuando mejoramos el CTA’",
    ],
    plan: [
      "Días 1–2: bio + pin.",
      "Días 3–15: cadencia diaria + 2 hilos.",
      "Días 16–23: engagement dirigido.",
      "Días 24–30: repetir formatos con mejor respuesta.",
    ],
  },
};

function goalOverlay(goal: CopyGoal | undefined, network: SocialNetwork): string {
  const label = goal ? GOAL_LABELS[goal] : "crecimiento";
  return `El análisis prioriza oportunidades orientadas a ${label.toLowerCase()} en ${NETWORK_LABELS[network]}.`;
}

function scoreFor(network: SocialNetwork, handle: string, hasNotes: boolean) {
  const base = 58 + (handle.length % 17) + (network.length % 5);
  return Math.min(86, base + (hasNotes ? 4 : 0));
}

export function analyzeSocialProfile(input: ProfileAnalysisRequest): ProfileAnalysis {
  const parsed = parseSocialProfileUrl(input.url);
  const playbook = networkPlaybooks[parsed.network];
  const niche = input.niche?.trim();
  const notes = input.notes?.trim();

  const opportunities: ProfileOpportunity[] = playbook.opportunities.map((item, index) => ({
    ...item,
    id: `opp-${index + 1}`,
    finding: niche
      ? `${item.finding} En nichos como “${niche}”, esto se nota más porque la audiencia compara rápido.`
      : item.finding,
    advice: notes
      ? `${item.advice} Considera además lo que comentaste: ${notes}`
      : item.advice,
  }));

  return {
    id: slugId("analysis"),
    url: parsed.url,
    network: parsed.network,
    handle: parsed.handle,
    score: scoreFor(parsed.network, parsed.handle, Boolean(notes || niche)),
    summary: `Auditoría de @${parsed.handle} en ${NETWORK_LABELS[parsed.network]}. ${goalOverlay(input.goal, parsed.network)} Se detectaron ${opportunities.length} áreas de oportunidad con acciones concretas para los próximos 30 días.`,
    strengths: playbook.strengths,
    opportunities,
    contentIdeas: niche
      ? playbook.ideas.map((idea) => `${idea} (ángulo: ${niche})`)
      : playbook.ideas,
    next30Days: playbook.plan,
  };
}

export function formatAnalysisAsText(analysis: ProfileAnalysis) {
  return [
    `Análisis de perfil · ${NETWORK_LABELS[analysis.network]}`,
    `Perfil: @${analysis.handle}`,
    `URL: ${analysis.url}`,
    `Score de oportunidad: ${analysis.score}/100`,
    "",
    analysis.summary,
    "",
    "Fortalezas:",
    ...analysis.strengths.map((s) => `- ${s}`),
    "",
    "Áreas de oportunidad:",
    ...analysis.opportunities.flatMap((o) => [
      `- [${o.priority.toUpperCase()}] ${o.area}`,
      `  Hallazgo: ${o.finding}`,
      `  Consejo: ${o.advice}`,
      `  Acción: ${o.action}`,
    ]),
    "",
    "Ideas de contenido:",
    ...analysis.contentIdeas.map((i) => `- ${i}`),
    "",
    "Plan 30 días:",
    ...analysis.next30Days.map((i) => `- ${i}`),
  ].join("\n");
}
