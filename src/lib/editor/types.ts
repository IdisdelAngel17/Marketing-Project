export const SUBTITLE_FONTS = {
  "dm-sans": {
    id: "dm-sans",
    label: "DM Sans",
    family: '"DM Sans", sans-serif',
    weight: 700,
  },
  "space-grotesk": {
    id: "space-grotesk",
    label: "Space Grotesk",
    family: '"Space Grotesk", sans-serif',
    weight: 700,
  },
  inter: {
    id: "inter",
    label: "Inter",
    family: 'Inter, system-ui, sans-serif',
    weight: 700,
  },
  montserrat: {
    id: "montserrat",
    label: "Montserrat",
    family: '"Montserrat", sans-serif',
    weight: 800,
  },
  oswald: {
    id: "oswald",
    label: "Oswald",
    family: '"Oswald", sans-serif',
    weight: 600,
  },
  bebas: {
    id: "bebas",
    label: "Bebas Neue",
    family: '"Bebas Neue", sans-serif',
    weight: 400,
  },
  playfair: {
    id: "playfair",
    label: "Playfair Display",
    family: '"Playfair Display", serif',
    weight: 700,
  },
  "source-serif": {
    id: "source-serif",
    label: "Source Serif",
    family: '"Source Serif 4", serif',
    weight: 600,
  },
} as const;

export type SubtitleFontId = keyof typeof SUBTITLE_FONTS;

export type CaptionStyle = "boxed" | "outline" | "minimal";

export interface CaptionCue {
  id: string;
  start: number;
  end: number;
  text: string;
}

export type ZoomKind = "in" | "out";

export interface ZoomCut {
  id: string;
  kind: ZoomKind;
  start: number;
  duration: number;
  scale: number;
  x: number;
  y: number;
}

export interface VideoFeedback {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  nextVideos: string[];
  metrics: {
    duration: number;
    captions: number;
    zooms: number;
    readingSpeed: number;
    hookWindow: string;
  };
}

export function formatTimecode(seconds: number) {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  const ms = Math.floor((safe % 1) * 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${ms}`;
}
