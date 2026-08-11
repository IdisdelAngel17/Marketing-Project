import type {
  ContentStrategy,
  CopyGoal,
  MarketingInsight,
  SocialNetwork,
  StrategyPhase,
  StrategyPillar,
  StrategyRequest,
} from "@/lib/types/studio";
import { GOAL_LABELS, NETWORK_LABELS } from "@/lib/types/studio";

function slugId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const networkCadence: Record<SocialNetwork, string> = {
  instagram: "4–6 piezas/semana: 3 Reels, 2 carruseles y Stories diarias en días hábiles.",
  tiktok: "5–7 videos/semana. Prioriza series fijas y 1 tendencia adaptada al nicho.",
  linkedin: "3 posts/semana + 1 documento. 15 min diarios de comentarios en cuentas del nicho.",
  facebook: "4 posts/semana + respuesta < 2 h. 1 pauta pequeña al creativo top.",
  youtube: "1 video largo/semana + 3 Shorts derivados. Thumbnail y título se deciden antes de grabar.",
  x: "2–4 posts/día y 1 hilo/semana. 20 min de replies en cuentas del sector.",
};

const northStar: Record<CopyGoal, string> = {
  alcance: "Cuentas alcanzadas únicas / semana",
  engagement: "Tasa de interacción + guardados / semana",
  leads: "Mensajes o formularios calificados / semana",
  ventas: "Conversiones atribuidas a contenido / mes",
  comunidad: "Miembros activos que comentan o vuelven / semana",
};

const kpisByGoal: Record<CopyGoal, string[]> = {
  alcance: ["Alcance", "Impresiones", "Tasa de reproducción 3s", "Crecimiento de seguidores"],
  engagement: ["ER %", "Guardados", "Comentarios", "Shares"],
  leads: ["Clics al link", "DMs iniciados", "Leads calificados", "Costo por lead (si hay pauta)"],
  ventas: ["CTR a oferta", "Reservas/compras", "ROAS de creativos top", "Tasa de cierre"],
  comunidad: ["Comentarios únicos", "Respuestas del equipo", "UGC recibido", "Retención de seguidores"],
};

const positioningByGoal: Record<CopyGoal, (p: string, n: string, net: string) => string> = {
  alcance: (p, n, net) =>
    `${p} se posiciona en ${net} como la referencia clara de ${n}: contenido rápido de entender y fácil de compartir.`,
  engagement: (p, n, net) =>
    `${p} en ${net} no publica para “estar”: publica para conversar. Cada pieza invita a opinar, guardar o responder sobre ${n}.`,
  leads: (p, n, net) =>
    `${p} usa ${net} como canal de diagnóstico: demuestra expertise en ${n} y mueve a una conversación privada.`,
  ventas: (p, n, net) =>
    `${p} trata ${net} como vitrina + prueba social. El contenido reduce duda y empuja una oferta concreta de ${n}.`,
  comunidad: (p, n, net) =>
    `${p} construye en ${net} un espacio de pertenencia para gente de ${n}: rituales, series y reconocimiento a la audiencia.`,
};

function pillarsFor(goal: CopyGoal, niche: string): StrategyPillar[] {
  const n = niche || "tu rubro";
  const base: Record<CopyGoal, StrategyPillar[]> = {
    alcance: [
      {
        name: "Hooks y tendencias",
        share: 40,
        purpose: "Detener el scroll y entrar a For You / exploración.",
        formats: ["Reel/Short", "trend nativa"],
        examples: [`Mito vs realidad de ${n}`, "El error #1 que todos cometen"],
      },
      {
        name: "Valor express",
        share: 35,
        purpose: "Enseñar algo útil en menos de 30s para que te recuerden.",
        formats: ["carrusel", "video corto"],
        examples: ["Checklist de 5 puntos", "Antes / después del proceso"],
      },
      {
        name: "Prueba y personalidad",
        share: 25,
        purpose: "Humanizar la marca para que el alcance no se sienta frío.",
        formats: ["Stories", "bastidores"],
        examples: ["Día en el equipo", "Lo que no salió bien y qué aprendimos"],
      },
    ],
    engagement: [
      {
        name: "Preguntas y loops",
        share: 35,
        purpose: "Forzar respuesta, no solo like.",
        formats: ["Stories con sticker", "post de pregunta"],
        examples: [`¿Qué te frena más en ${n}?`, "A o B: elige y justifica"],
      },
      {
        name: "Piezas guardables",
        share: 40,
        purpose: "Subir saves, la señal que más empuja distribución.",
        formats: ["carrusel", "documento"],
        examples: ["Plantilla reutilizable", "Framework de 4 pasos"],
      },
      {
        name: "Conversación de comunidad",
        share: 25,
        purpose: "Responder en comentarios y reciclar UGC.",
        formats: ["respuesta en video", "reposts"],
        examples: ["Respondemos el comentario más útil", "Caso de un seguidor"],
      },
    ],
    leads: [
      {
        name: "Diagnóstico",
        share: 40,
        purpose: "Que la audiencia se identifique con el problema.",
        formats: ["carrusel", "Reel"],
        examples: [`3 señales de que tu ${n} está estancado`, "Test rápido: ¿en qué etapa estás?"],
      },
      {
        name: "Prueba de método",
        share: 35,
        purpose: "Mostrar que hay un camino y no solo opinión.",
        formats: ["caso", "demo"],
        examples: ["Así lo resolvimos en 14 días", "Walkthrough del proceso"],
      },
      {
        name: "Oferta suave",
        share: 25,
        purpose: "Convertir atención en DM/agenda sin parecer infomercial.",
        formats: ["Stories CTA", "post con lead magnet"],
        examples: ["Guía gratis por comentario", "Diagnóstico de 15 min"],
      },
    ],
    ventas: [
      {
        name: "Oferta y urgencia ética",
        share: 30,
        purpose: "Dejar claro qué se compra, para quién y por qué ahora.",
        formats: ["post oferta", "Stories countdown"],
        examples: ["Qué incluye / qué no incluye", "Cupos de la semana"],
      },
      {
        name: "Objeciones",
        share: 35,
        purpose: "Desarmar dudas de precio, tiempo y confianza.",
        formats: ["FAQ en video", "carrusel"],
        examples: ["¿Es para principiantes?", "Cuánto tarda en verse resultado"],
      },
      {
        name: "Prueba social",
        share: 35,
        purpose: "Terceros venden mejor que la marca.",
        formats: ["testimonio", "UGC"],
        examples: ["Resultado de cliente", "Screenshot de mensaje (con permiso)"],
      },
    ],
    comunidad: [
      {
        name: "Rituales semanales",
        share: 40,
        purpose: "Crear hábito de volver.",
        formats: ["serie fija", "live corto"],
        examples: [`Lunes de ${n}`, "Viernes de preguntas"],
      },
      {
        name: "Reconocimiento",
        share: 30,
        purpose: "Hacer sentir vista a la audiencia.",
        formats: ["reposts", "spotlight"],
        examples: ["Miembro de la semana", "Respondemos 5 DMs en Stories"],
      },
      {
        name: "Co-creación",
        share: 30,
        purpose: "Que el contenido nazca de ellos.",
        formats: ["encuesta", "reto"],
        examples: ["Elige el próximo tema", "Reto de 7 días"],
      },
    ],
  };
  return base[goal];
}

function funnelFor(goal: CopyGoal, network: SocialNetwork) {
  const net = NETWORK_LABELS[network];
  return [
    {
      stage: "TOFU · Descubrimiento",
      job: "Entrar al feed de gente nueva.",
      content: `Hooks nativos de ${net}, tendencias útiles y piezas de 15–30s sin pedir nada todavía.`,
    },
    {
      stage: "MOFU · Confianza",
      job: "Demostrar método y personalidad.",
      content:
        goal === "ventas" || goal === "leads"
          ? "Casos, bastidores y frameworks. Aquí se gana el derecho a invitar."
          : "Series, guardables y conversación. Aquí se construye recuerdo de marca.",
    },
    {
      stage: "BOFU · Acción",
      job: `Empujar el objetivo: ${GOAL_LABELS[goal].toLowerCase()}.`,
      content:
        "Un CTA único por semana, repetido en caption, comentario pineado y Stories. Nada de 4 links distintos.",
    },
  ];
}

function phasesFor(goal: CopyGoal): StrategyPhase[] {
  return [
    {
      name: "Fundación",
      weeks: "Semanas 1–2",
      focus: "Claridad de perfil y sistema.",
      actions: [
        "Alinear bio, highlights/featured y CTA del perfil al objetivo.",
        "Definir 3 pilares y nombrar 1 serie recurrente.",
        "Publicar el ritmo mínimo sin faltar un día del calendario.",
      ],
    },
    {
      name: "Tracción",
      weeks: "Semanas 3–6",
      focus: "Aprender qué formato mueve el KPI.",
      actions: [
        "Duplicar el formato top y matar el que no retiene.",
        "Responder todos los comentarios en < 4 horas hábiles.",
        goal === "leads" || goal === "ventas"
          ? "Instalar un único destino (WhatsApp, form o agenda) y medirlo."
          : "Subir frecuencia solo en el formato ganador.",
      ],
    },
    {
      name: "Escalamiento",
      weeks: "Semanas 7–12",
      focus: "Convertir aprendizaje en sistema.",
      actions: [
        "Lote de 12 contenidos del formato ganador.",
        "Pauta ligera o remix de las 3 piezas top.",
        "Reporte quincenal: qué repetir, qué iterar, qué descartar.",
      ],
    },
  ];
}

function ctasFor(goal: CopyGoal, offer?: string) {
  const o = offer?.trim();
  const extras = o ? [`Habla de esto: ${o}`] : [];
  const map: Record<CopyGoal, string[]> = {
    alcance: ["Guárdalo y mándalo a alguien del equipo", "Síguenos para la parte 2"],
    engagement: ["Comenta X y te respondo", "Elige A o B en comentarios"],
    leads: ["Escríbenos DEMO y te mandamos la guía", "Agenda 15 min sin compromiso"],
    ventas: ["Reserva tu lugar esta semana", "Pide la cotización por DM"],
    comunidad: ["Etiqueta a tu socio de contenido", "Cuéntanos cómo lo haces tú"],
  };
  return [...map[goal], ...extras].slice(0, 4);
}

function insightsFor(network: SocialNetwork, goal: CopyGoal, niche: string): MarketingInsight[] {
  const n = NETWORK_LABELS[network];
  const g = GOAL_LABELS[goal].toLowerCase();
  const topic = niche || "tu categoría";

  const platform: Record<SocialNetwork, MarketingInsight[]> = {
    instagram: [
      {
        id: "ig-algo",
        category: "Algoritmo",
        title: "Instagram premia retención + guardados, no solo likes",
        insight:
          "Reels con texto en el segundo 0–1 y carruseles que se llegan hasta la última slide reciben más distribución. El like ya no es la señal principal.",
        howToUse:
          "Mide guardados y shares semanales. Si un carrusel supera 3× el promedio de saves, conviértelo en Reel a la semana siguiente.",
      },
      {
        id: "ig-bio",
        category: "Conversión",
        title: "La bio es una landing de 150 caracteres",
        insight:
          "La mayoría del tráfico caliente llega al perfil, no al link in bio a la primera. Si la bio es vaga, se pierde el objetivo de " +
          g +
          ".",
        howToUse: `Quién + para quién (${topic}) + resultado + un solo CTA. Quita emojis decorativos que no ayuden a escanear.`,
      },
    ],
    tiktok: [
      {
        id: "tt-watch",
        category: "Algoritmo",
        title: "Watch time manda más que seguidores",
        insight:
          "Una cuenta nueva puede superar a una grande si retiene. Los primeros 1–2s deciden si el video vive o muere.",
        howToUse:
          "Graba 3 aperturas del mismo tip. Publica la de mayor retención. Repite el patrón, no el audio de moda sin contexto.",
      },
      {
        id: "tt-series",
        category: "Crecimiento",
        title: "Las series crean hábito; los one-offs no",
        insight:
          "TikTok empuja cuentas predecibles. Un nombre de serie (“Lunes de hooks”) enseña al usuario a buscarte.",
        howToUse: `Crea una serie semanal de ${topic} con 4 capítulos ya escritos antes de publicar el 1.`,
      },
    ],
    linkedin: [
      {
        id: "li-dwell",
        category: "Algoritmo",
        title: "Dwell time > impresiones vanidosas",
        insight:
          "Posts que se leen hasta el final (líneas cortas, saltos, gancho en la 1ª línea) reciben más distribución que copys densos.",
        howToUse:
          "Primera línea = promesa o tensión. Cuerpo en bloques de 1–2 líneas. CTA de comentario específico, no “sígueme”.",
      },
      {
        id: "li-doc",
        category: "Formato",
        title: "El documento nativo es el formato de autoridad",
        insight:
          "Los PDFs/carruseles se guardan y se reenvían en equipos B2B, ideales si el objetivo es " +
          g +
          ".",
        howToUse: `Empaqueta un framework de ${topic} en 8–10 páginas. Una vez al mes basta si el resto son posts cortos.`,
      },
    ],
    facebook: [
      {
        id: "fb-community",
        category: "Distribución",
        title: "Facebook sigue pagando conversación, no broadcast",
        insight:
          "Posts con comentarios genuinos en la primera hora se empujan a más amigos/seguidores. El silencio mata el post.",
        howToUse:
          "Publica cuando puedas responder. Prepara 5 respuestas a objeciones. Evita links externos en el primer comentario si buscas alcance.",
      },
      {
        id: "fb-ads",
        category: "Performance",
        title: "El orgánico top es el creativo de pauta más barato",
        insight:
          "Escalar en frío sin prueba orgánica suele encarecer el lead. Facebook ya te dijo qué mensaje resuena.",
        howToUse:
          "Toma el post con mejor ER de la semana y páutalo 3 días con presupuesto chico hacia el mismo objetivo.",
      },
    ],
    youtube: [
      {
        id: "yt-packaging",
        category: "CTR",
        title: "El empaquetado vende el clic; el video retiene la sesión",
        insight:
          "Título + thumbnail deciden el CTR. Intro de más de 15s sin promesa hunde la retención media, la métrica que recomienda el canal.",
        howToUse:
          "Escribe 5 títulos antes de grabar. Thumbnail con emoción o resultado, no logo gigante. Capítulos desde el minuto 0.",
      },
      {
        id: "yt-atom",
        category: "Repurposing",
        title: "Un largo bien hecho alimenta toda la semana",
        insight:
          "YouTube Shorts + comunidad + email pueden salir del mismo video si el guion tiene 3 momentos recortables.",
        howToUse:
          "Marca en el guion 3 “clips” de 20–40s. Publícalos 24–48 h después del largo, con CTA de vuelta al video.",
      },
    ],
    x: [
      {
        id: "x-hook",
        category: "Distribución",
        title: "El primer tweet del hilo es un anuncio",
        insight:
          "Si el hook no se entiende en 8 palabras, el hilo no se abre. X distribuye cuentas que provocan respuesta, no solo información.",
        howToUse:
          "Hook con tensión o dato. 6–8 puntos. Ejemplo concreto. CTA de reply. Fija el mejor hilo del mes.",
      },
      {
        id: "x-reply",
        category: "Crecimiento",
        title: "El reply graph crece más que el broadcasting",
        insight:
          "Comentar con valor en cuentas del nicho expone tu perfil a audiencias calientes sin gastar pauta.",
        howToUse: `20 min al día: 10 replies útiles en ${topic}. Cero “gran post 🔥”. Si no añade insight, no lo publiques.`,
      },
    ],
  };

  const goalInsights: Record<CopyGoal, MarketingInsight> = {
    alcance: {
      id: "goal-alcance",
      category: "Objetivo",
      title: "Alcance sin mensaje claro es vanidad",
      insight:
        "Subir impresiones no sirve si nadie recuerda qué haces. El contenido viral debe repetir una promesa de marca.",
      howToUse: `Termina cada pieza viral con la misma frase de posicionamiento de ${topic}.`,
    },
    engagement: {
      id: "goal-eng",
      category: "Objetivo",
      title: "Pide una micro-acción, no “qué opinas?” genérico",
      insight:
        "Las preguntas vagas bajan la calidad de comentarios. Las específicas (“comenta PRECIO si te frena el cobro”) multiplican replies.",
      howToUse: "Un verbo + una palabra ancla. Responde el primero tú mismo para dar el molde.",
    },
    leads: {
      id: "goal-leads",
      category: "Objetivo",
      title: "El lead magnet debe resolver 20% del problema, no el 100%",
      insight:
        "Si regalas todo, no hay motivo para escribirte. Si no regalas nada, el DM se siente venta fría.",
      howToUse: `Ofrece un diagnóstico o checklist de ${topic}. El “cómo lo implementamos juntos” queda para la llamada.`,
    },
    ventas: {
      id: "goal-ventas",
      category: "Objetivo",
      title: "Vender en social es reducir riesgo percibido",
      insight:
        "La gente no compra por más features; compra cuando baja el miedo a equivocarse (precio, tiempo, confianza).",
      howToUse:
        "Cada pieza BOFU debe atacar UNA objeción. Alterna prueba social, FAQ y demostración. Nunca las tres a la vez.",
    },
    comunidad: {
      id: "goal-com",
      category: "Objetivo",
      title: "Comunidad = ritual + reconocimiento + rol",
      insight:
        "Sin un motivo para volver (ritual), sin sentirse visto (reconocimiento) y sin un papel que jugar (rol), el grupo se vuelve audiencia pasiva.",
      howToUse:
        "Nombra la serie, destaca a 1 persona/semana y pide una tarea simple (voto, foto, tip).",
    },
  };

  const universal: MarketingInsight[] = [
    {
      id: "mix-70",
      category: "Mix de contenido",
      title: "Regla 70/20/10 para no quemar a la audiencia",
      insight:
        "70% valor, 20% prueba de marca, 10% promoción directa. Invertirlo es la causa #1 de caída de ER cuando “empezamos a vender”.",
      howToUse:
        "Si esta semana ya llevas 2 posts de oferta, el siguiente tiene que enseñar o conversar. Sin excepciones.",
    },
    {
      id: "one-cta",
      category: "Psicología",
      title: "Un solo CTA vence a un menú de opciones",
      insight:
        "Hick’s Law: más opciones, menos acción. Bio + caption + Stories deben repetir el mismo siguiente paso.",
      howToUse: `Elige el CTA maestro para ${g} y úsalo 7 días. Mide. Luego itera el wording, no el destino.`,
    },
    {
      id: "proof",
      category: "Psicología",
      title: "Prueba específica > adjetivo de marca",
      insight:
        "“Somos líderes” no convence. “En 14 días bajamos el tiempo de producción a la mitad” sí. El cerebro busca evidencia concreta.",
      howToUse:
        "Sustituye 1 adjetivo por 1 número, plazo o cita de cliente en cada pieza de autoridad.",
    },
  ];

  return [...platform[network], goalInsights[goal], ...universal];
}

export function generateContentStrategy(req: StrategyRequest): ContentStrategy {
  if (!req.profileName.trim()) {
    throw new Error("Indica el nombre del perfil o marca.");
  }

  const niche = req.niche.trim() || "tu industria";
  const audience = req.audience.trim() || `personas interesadas en ${niche}`;
  const networkLabel = NETWORK_LABELS[req.network];
  const offer = req.offer?.trim();
  const notes = req.notes?.trim();

  const promise = offer
    ? `${req.profileName} ayuda a ${audience} a avanzar en ${niche} a través de ${offer}.`
    : `${req.profileName} ayuda a ${audience} a avanzar en ${niche} con contenido claro y un siguiente paso obvio.`;

  return {
    id: slugId("strategy"),
    profileName: req.profileName.trim(),
    handle: (req.handle.trim() || req.profileName.trim()).replace(/^@/, ""),
    network: req.network,
    goal: req.goal,
    positioning: positioningByGoal[req.goal](req.profileName.trim(), niche, networkLabel),
    promise,
    audienceSnapshot: notes
      ? `${audience}. Contexto extra: ${notes}`
      : `${audience}. Habla su problema en su idioma, no el jerga interna del equipo.`,
    northStarMetric: northStar[req.goal],
    kpis: kpisByGoal[req.goal],
    cadence: networkCadence[req.network],
    mix: pillarsFor(req.goal, niche),
    funnel: funnelFor(req.goal, req.network),
    phases: phasesFor(req.goal),
    ctas: ctasFor(req.goal, offer),
    risks: [
      "Cambiar de CTA cada publicación y no poder atribuir resultados.",
      "Copiar tendencias sin anclarlas al nicho: hay views, no clientes.",
      "Medir likes en vez de la métrica norte. El equipo optimiza lo equivocado.",
    ],
    insights: insightsFor(req.network, req.goal, niche),
  };
}

export function formatStrategyAsText(strategy: ContentStrategy) {
  return [
    `Estrategia · ${strategy.profileName} (@${strategy.handle})`,
    `Red: ${NETWORK_LABELS[strategy.network]} · Objetivo: ${GOAL_LABELS[strategy.goal]}`,
    "",
    "Posicionamiento:",
    strategy.positioning,
    "",
    "Promesa:",
    strategy.promise,
    "",
    "Audiencia:",
    strategy.audienceSnapshot,
    "",
    `Métrica norte: ${strategy.northStarMetric}`,
    `KPIs: ${strategy.kpis.join(", ")}`,
    `Cadencia: ${strategy.cadence}`,
    "",
    "Pilares:",
    ...strategy.mix.flatMap((p) => [
      `- ${p.name} (${p.share}%) — ${p.purpose}`,
      `  Formatos: ${p.formats.join(", ")}`,
      `  Ejemplos: ${p.examples.join(" · ")}`,
    ]),
    "",
    "Embudo:",
    ...strategy.funnel.map((f) => `- ${f.stage}: ${f.job} / ${f.content}`),
    "",
    "Fases:",
    ...strategy.phases.flatMap((ph) => [`- ${ph.name} (${ph.weeks}): ${ph.focus}`, ...ph.actions.map((a) => `  · ${a}`)]),
    "",
    "CTAs:",
    ...strategy.ctas.map((c) => `- ${c}`),
    "",
    "Insights de marketing:",
    ...strategy.insights.flatMap((i) => [
      `- [${i.category}] ${i.title}`,
      `  ${i.insight}`,
      `  Cómo usarlo: ${i.howToUse}`,
    ]),
  ].join("\n");
}
