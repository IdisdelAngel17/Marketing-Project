import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import type {
  CalendarPost,
  CalendarRequest,
  ContentCalendar,
  ContentFormat,
  ContentPillar,
  CopyGoal,
  NetworkCalendar,
  SocialNetwork,
  Tone,
} from "@/lib/types/studio";
import { NETWORK_LABELS } from "@/lib/types/studio";

type Slot = {
  weekday: number; // 0 Sun .. 6 Sat
  time: string;
  format: ContentFormat;
  pillar: ContentPillar;
};

const cadence: Record<SocialNetwork, Slot[]> = {
  instagram: [
    { weekday: 1, time: "11:00", format: "carrusel", pillar: "educativo" },
    { weekday: 2, time: "18:30", format: "reel", pillar: "comunidad" },
    { weekday: 3, time: "12:00", format: "story", pillar: "bastidores" },
    { weekday: 4, time: "19:00", format: "reel", pillar: "autoridad" },
    { weekday: 5, time: "10:30", format: "carrusel", pillar: "conversion" },
    { weekday: 6, time: "17:00", format: "story", pillar: "promocion" },
  ],
  tiktok: [
    { weekday: 1, time: "12:30", format: "short", pillar: "educativo" },
    { weekday: 2, time: "19:00", format: "short", pillar: "comunidad" },
    { weekday: 3, time: "13:00", format: "short", pillar: "bastidores" },
    { weekday: 5, time: "18:00", format: "short", pillar: "autoridad" },
    { weekday: 6, time: "16:00", format: "short", pillar: "conversion" },
  ],
  linkedin: [
    { weekday: 1, time: "09:00", format: "post", pillar: "autoridad" },
    { weekday: 3, time: "10:00", format: "documento", pillar: "educativo" },
    { weekday: 5, time: "09:30", format: "post", pillar: "conversion" },
  ],
  facebook: [
    { weekday: 2, time: "11:00", format: "post", pillar: "comunidad" },
    { weekday: 4, time: "18:00", format: "video", pillar: "educativo" },
    { weekday: 6, time: "12:00", format: "post", pillar: "promocion" },
  ],
  youtube: [
    { weekday: 2, time: "17:00", format: "short", pillar: "educativo" },
    { weekday: 4, time: "18:00", format: "video", pillar: "autoridad" },
    { weekday: 6, time: "11:00", format: "short", pillar: "comunidad" },
  ],
  x: [
    { weekday: 1, time: "09:30", format: "post", pillar: "autoridad" },
    { weekday: 2, time: "13:00", format: "hilo", pillar: "educativo" },
    { weekday: 3, time: "18:00", format: "post", pillar: "comunidad" },
    { weekday: 5, time: "10:00", format: "post", pillar: "conversion" },
  ],
};

const titles: Record<ContentPillar, string[]> = {
  educativo: [
    "3 errores que frenan tu crecimiento",
    "Checklist rápido de la semana",
    "Lo que nadie te explica de {tema}",
    "Guía corta: de idea a publicación",
  ],
  autoridad: [
    "Lo que medimos (y por qué importa)",
    "Caso real: qué funcionó este mes",
    "Opinión con datos sobre {tema}",
    "Framework que usamos con clientes",
  ],
  comunidad: [
    "Pregunta abierta para nuestra audiencia",
    "Detrás del comentario más útil",
    "¿Tú qué harías en este escenario?",
    "Historias de la comunidad",
  ],
  conversion: [
    "Cómo dar el siguiente paso con nosotros",
    "Oferta clara + prueba social",
    "Agenda tu diagnóstico sin compromiso",
    "De tip a resultado: CTA de la semana",
  ],
  bastidores: [
    "Así preparamos el contenido",
    "Un día en el equipo",
    "Errores que corregimos en edición",
    "Proceso real, sin filtros",
  ],
  promocion: [
    "Novedad de la semana",
    "Beneficio destacado para {audiencia}",
    "Últimos lugares / recordatorio suave",
    "Por qué ahora es buen momento",
  ],
};

const assetsByFormat: Record<ContentFormat, string> = {
  post: "Imagen 1:1 + copy",
  carrusel: "6–8 slides + portada",
  reel: "Video vertical 15–30s + subtítulos",
  story: "3–5 frames + sticker de pregunta",
  video: "Video horizontal/vertical + thumbnail",
  short: "Vertical < 60s + texto en pantalla",
  hilo: "Hook + 6 tweets + CTA",
  documento: "PDF/carrusel nativo 8–10 páginas",
  live: "Guion de 20 min + CTA en vivo",
};

const ctasByGoal: Record<CopyGoal, string[]> = {
  alcance: ["Guárdalo y compártelo", "Etiqueta a alguien del equipo"],
  engagement: ["Comenta tu experiencia", "Responde con un emoji si te pasó"],
  leads: ["Escríbenos al DM", "Agenda una llamada corta"],
  ventas: ["Aprovecha la oferta de esta semana", "Reserva tu lugar hoy"],
  comunidad: ["Únete a la conversación", "Cuéntanos cómo lo haces tú"],
};

function slugId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function pick<T>(items: T[], index: number): T {
  return items[index % items.length]!;
}

function toneLead(tone: Tone, profile: string): string {
  switch (tone) {
    case "cercano":
      return `En ${profile} queremos contarte esto sin rodeos:`;
    case "profesional":
      return `${profile} resume el aprendizaje clave:`;
    case "inspirador":
      return `Hoy ${profile} te invita a dar un paso más:`;
    case "directo":
      return `Haz esto con ${profile}:`;
    case "jugueton":
      return `Plot twist de ${profile}:`;
  }
}

function buildCaption(
  req: CalendarRequest,
  pillar: ContentPillar,
  title: string,
  cta: string,
) {
  return `${toneLead(req.tone, req.profileName)}\n\n${title}.\n\nPensado para ${req.niche || "tu audiencia"} en modo ${pillar}.\n\n${cta}`;
}

function postsPerWeek(network: SocialNetwork) {
  return cadence[network].length;
}

function generateNetworkCalendar(
  req: CalendarRequest,
  network: SocialNetwork,
): NetworkCalendar {
  const start = parseISO(req.startDate);
  const end = addDays(start, req.days - 1);
  const slots = cadence[network];
  const posts: CalendarPost[] = [];
  let counter = 0;

  for (let offset = 0; offset < req.days; offset += 1) {
    const date = addDays(start, offset);
    const weekday = date.getDay();
    const daySlots = slots.filter((s) => s.weekday === weekday);

    for (const slot of daySlots) {
      const titleTemplate = pick(titles[slot.pillar], counter + weekday);
      const title = titleTemplate
        .replace("{tema}", req.niche || "contenido")
        .replace("{audiencia}", req.niche || "tu audiencia");
      const cta = pick(ctasByGoal[req.goal], counter);
      const dateStr = format(date, "yyyy-MM-dd");

      posts.push({
        id: `${network}-${dateStr}-${slot.time}-${counter}`,
        date: dateStr,
        time: slot.time,
        weekday: format(date, "EEEE", { locale: es }),
        network,
        format: slot.format,
        pillar: slot.pillar,
        title,
        caption: buildCaption(req, slot.pillar, title, cta),
        cta,
        assets: assetsByFormat[slot.format],
        status: "programado",
      });
      counter += 1;
    }
  }

  // Ensure end date referenced for typing
  void end;

  return {
    network,
    postsPerWeek: postsPerWeek(network),
    posts,
  };
}

export function generateContentCalendar(req: CalendarRequest): ContentCalendar {
  if (!req.profileName.trim()) {
    throw new Error("Indica el nombre del perfil o marca.");
  }
  if (!req.networks.length) {
    throw new Error("Selecciona al menos una red social.");
  }

  const start = parseISO(req.startDate);
  if (Number.isNaN(start.getTime())) {
    throw new Error("La fecha de inicio no es válida.");
  }

  const networks = req.networks.map((network) => generateNetworkCalendar(req, network));

  return {
    id: slugId("cal"),
    profileName: req.profileName.trim(),
    handle: (req.handle.trim() || req.profileName.trim()).replace(/^@/, ""),
    niche: req.niche.trim() || "general",
    goal: req.goal,
    tone: req.tone,
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(addDays(start, req.days - 1), "yyyy-MM-dd"),
    networks,
  };
}

export function formatCalendarAsText(calendar: ContentCalendar) {
  const lines = [
    `Calendario de contenido · ${calendar.profileName} (@${calendar.handle})`,
    `Periodo: ${calendar.startDate} → ${calendar.endDate}`,
    `Nicho: ${calendar.niche}`,
    "",
  ];

  for (const net of calendar.networks) {
    lines.push(`## ${NETWORK_LABELS[net.network]} (${net.posts.length} posts)`);
    for (const post of net.posts) {
      lines.push(
        `- ${post.date} ${post.time} | ${post.format} | ${post.pillar}`,
        `  ${post.title}`,
        `  CTA: ${post.cta}`,
        `  Assets: ${post.assets}`,
        "",
      );
    }
  }

  return lines.join("\n");
}

export function calendarToCsv(calendar: ContentCalendar) {
  const header = [
    "fecha",
    "hora",
    "red",
    "perfil",
    "formato",
    "pilar",
    "titulo",
    "cta",
    "assets",
    "caption",
  ];
  const rows = calendar.networks.flatMap((net) =>
    net.posts.map((p) =>
      [
        p.date,
        p.time,
        NETWORK_LABELS[p.network],
        calendar.handle,
        p.format,
        p.pillar,
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.cta.replace(/"/g, '""')}"`,
        `"${p.assets.replace(/"/g, '""')}"`,
        `"${p.caption.replace(/"/g, '""').replace(/\n/g, " / ")}"`,
      ].join(","),
    ),
  );
  return [header.join(","), ...rows].join("\n");
}
