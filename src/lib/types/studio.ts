export type SocialNetwork =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "x"
  | "youtube";

export type Tone =
  | "cercano"
  | "profesional"
  | "inspirador"
  | "directo"
  | "jugueton";

export type CopyGoal =
  | "alcance"
  | "engagement"
  | "leads"
  | "ventas"
  | "comunidad";

export type VideoFormat = "reels" | "tiktok" | "shorts" | "stories" | "youtube";

export type VideoDuration = "15" | "30" | "60" | "90";

export interface CopyRequest {
  brand: string;
  network: SocialNetwork;
  topic: string;
  audience: string;
  tone: Tone;
  goal: CopyGoal;
  cta: string;
  keywords?: string;
}

export interface GeneratedCopy {
  id: string;
  headline: string;
  body: string;
  hashtags: string[];
  cta: string;
  notes: string;
}

export interface ScriptRequest {
  brand: string;
  format: VideoFormat;
  duration: VideoDuration;
  topic: string;
  audience: string;
  tone: Tone;
  goal: CopyGoal;
  cta: string;
}

export interface ScriptScene {
  time: string;
  visual: string;
  voiceover: string;
  onScreenText: string;
}

export interface GeneratedScript {
  id: string;
  title: string;
  hook: string;
  scenes: ScriptScene[];
  cta: string;
  caption: string;
  hashtags: string[];
}

export interface PostPerformance {
  id: string;
  title: string;
  network: SocialNetwork;
  publishedAt: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagementRate: number;
}

export interface NetworkWeeklySummary {
  network: SocialNetwork;
  followers: number;
  followersDelta: number;
  reach: number;
  engagementRate: number;
  posts: number;
  topPostId: string;
}

export interface WeeklyReport {
  id: string;
  weekLabel: string;
  startDate: string;
  endDate: string;
  client: string;
  networks: NetworkWeeklySummary[];
  posts: PostPerformance[];
  highlights: string[];
  recommendations: string[];
}

export const NETWORK_LABELS: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  x: "X",
  youtube: "YouTube",
};

export const TONE_LABELS: Record<Tone, string> = {
  cercano: "Cercano",
  profesional: "Profesional",
  inspirador: "Inspirador",
  directo: "Directo",
  jugueton: "Juguetón",
};

export const GOAL_LABELS: Record<CopyGoal, string> = {
  alcance: "Alcance",
  engagement: "Engagement",
  leads: "Leads",
  ventas: "Ventas",
  comunidad: "Comunidad",
};

export const FORMAT_LABELS: Record<VideoFormat, string> = {
  reels: "Reels",
  tiktok: "TikTok",
  shorts: "Shorts",
  stories: "Stories",
  youtube: "YouTube",
};

export type OpportunityPriority = "alta" | "media" | "rapida";

export interface ProfileAnalysisRequest {
  url: string;
  niche?: string;
  goal?: CopyGoal;
  notes?: string;
}

export interface ProfileOpportunity {
  id: string;
  area: string;
  priority: OpportunityPriority;
  finding: string;
  advice: string;
  action: string;
}

export interface ProfileAnalysis {
  id: string;
  url: string;
  network: SocialNetwork;
  handle: string;
  score: number;
  summary: string;
  strengths: string[];
  opportunities: ProfileOpportunity[];
  contentIdeas: string[];
  next30Days: string[];
}

export type ContentFormat =
  | "post"
  | "carrusel"
  | "reel"
  | "story"
  | "video"
  | "short"
  | "hilo"
  | "documento"
  | "live";

export type ContentPillar =
  | "educativo"
  | "autoridad"
  | "comunidad"
  | "conversion"
  | "bastidores"
  | "promocion";

export interface CalendarRequest {
  profileName: string;
  handle: string;
  niche: string;
  goal: CopyGoal;
  tone: Tone;
  startDate: string;
  days: 7 | 14 | 30;
  networks: SocialNetwork[];
}

export interface CalendarPost {
  id: string;
  date: string;
  time: string;
  weekday: string;
  network: SocialNetwork;
  format: ContentFormat;
  pillar: ContentPillar;
  title: string;
  caption: string;
  cta: string;
  assets: string;
  status: "programado";
}

export interface NetworkCalendar {
  network: SocialNetwork;
  postsPerWeek: number;
  posts: CalendarPost[];
}

export interface ContentCalendar {
  id: string;
  profileName: string;
  handle: string;
  niche: string;
  goal: CopyGoal;
  tone: Tone;
  startDate: string;
  endDate: string;
  networks: NetworkCalendar[];
}

export const FORMAT_CONTENT_LABELS: Record<ContentFormat, string> = {
  post: "Post",
  carrusel: "Carrusel",
  reel: "Reel",
  story: "Stories",
  video: "Video",
  short: "Short",
  hilo: "Hilo",
  documento: "Documento",
  live: "Live",
};

export const PILLAR_LABELS: Record<ContentPillar, string> = {
  educativo: "Educativo",
  autoridad: "Autoridad",
  comunidad: "Comunidad",
  conversion: "Conversión",
  bastidores: "Bastidores",
  promocion: "Promoción",
};

export interface StrategyRequest {
  profileName: string;
  handle: string;
  niche: string;
  audience: string;
  network: SocialNetwork;
  goal: CopyGoal;
  offer?: string;
  notes?: string;
}

export interface StrategyPillar {
  name: string;
  share: number;
  purpose: string;
  formats: string[];
  examples: string[];
}

export interface StrategyPhase {
  name: string;
  weeks: string;
  focus: string;
  actions: string[];
}

export interface MarketingInsight {
  id: string;
  category: string;
  title: string;
  insight: string;
  howToUse: string;
}

export interface ContentStrategy {
  id: string;
  profileName: string;
  handle: string;
  network: SocialNetwork;
  goal: CopyGoal;
  positioning: string;
  promise: string;
  audienceSnapshot: string;
  northStarMetric: string;
  kpis: string[];
  cadence: string;
  mix: StrategyPillar[];
  funnel: { stage: string; job: string; content: string }[];
  phases: StrategyPhase[];
  ctas: string[];
  risks: string[];
  insights: MarketingInsight[];
}
