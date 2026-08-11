import { isSupabaseConfigured, getSupabase } from "@/lib/supabase/client";
import type {
  CopyGoal,
  CopyRequest,
  GeneratedCopy,
  GeneratedScript,
  NetworkWeeklySummary,
  PostPerformance,
  ScriptRequest,
  SocialNetwork,
  WeeklyReport,
} from "@/lib/types/studio";
import { NETWORK_LABELS } from "@/lib/types/studio";

const COPIES_KEY = "cmia.copies.v1";
const SCRIPTS_KEY = "cmia.scripts.v1";
const REPORTS_KEY = "cmia.reports.v1";

export interface SavedCopy extends GeneratedCopy {
  userId: string;
  brand: string;
  network: SocialNetwork;
  topic: string;
  audience: string;
  tone: string;
  goal: CopyGoal;
  createdAt: string;
}

export interface SavedScript extends GeneratedScript {
  userId: string;
  brand: string;
  format: string;
  duration: string;
  topic: string;
  createdAt: string;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readLocal<T>(key: string): T[] {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]") as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, value: T[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function isMissingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "PGRST205" || error.message?.includes("schema cache") === true;
}

async function currentUserId() {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getSupabase().auth.getUser();
  return data.user?.id ?? null;
}

export function engagementRate(post: Pick<PostPerformance, "reach" | "likes" | "comments" | "shares" | "saves">) {
  if (!post.reach) return 0;
  return Number((((post.likes + post.comments + post.shares + post.saves) / post.reach) * 100).toFixed(1));
}

export function buildNetworkSummaries(posts: PostPerformance[]): NetworkWeeklySummary[] {
  const byNetwork = new Map<SocialNetwork, PostPerformance[]>();
  for (const post of posts) {
    const list = byNetwork.get(post.network) ?? [];
    list.push(post);
    byNetwork.set(post.network, list);
  }

  return [...byNetwork.entries()].map(([network, list]) => {
    const reach = list.reduce((acc, p) => acc + p.reach, 0);
    const avgEng =
      list.reduce((acc, p) => acc + p.engagementRate, 0) / Math.max(list.length, 1);
    const top = [...list].sort((a, b) => b.engagementRate - a.engagementRate)[0];
    return {
      network,
      followers: 0,
      followersDelta: 0,
      reach,
      engagementRate: Number(avgEng.toFixed(1)),
      posts: list.length,
      topPostId: top?.id ?? "",
    };
  });
}

export function autoInsights(posts: PostPerformance[]) {
  if (posts.length === 0) {
    return {
      highlights: ["Aún no hay publicaciones en este reporte."],
      recommendations: ["Agrega el desempeño de cada pieza para obtener consejos."],
    };
  }
  const top = [...posts].sort((a, b) => b.engagementRate - a.engagementRate)[0]!;
  const weak = [...posts].sort((a, b) => a.engagementRate - b.engagementRate)[0]!;
  const byNetwork = buildNetworkSummaries(posts);
  const bestNetwork = [...byNetwork].sort((a, b) => b.engagementRate - a.engagementRate)[0]!;

  return {
    highlights: [
      `Mejor pieza: “${top.title}” en ${NETWORK_LABELS[top.network]} (${top.engagementRate}% eng.).`,
      `${NETWORK_LABELS[bestNetwork.network]} lideró engagement promedio (${bestNetwork.engagementRate}%).`,
      `Se analizaron ${posts.length} publicaciones en ${byNetwork.length} redes.`,
    ],
    recommendations: [
      `Replica el formato de “${top.title}” en las demás redes esta semana.`,
      `Revisa “${weak.title}” (${NETWORK_LABELS[weak.network]}): mejora hook, CTA o horario.`,
      "Prioriza 1 CTA medible y compara alcance vs guardados en el siguiente periodo.",
    ],
  };
}

export async function saveGeneratedCopies(req: CopyRequest, copies: GeneratedCopy[], userId: string) {
  const rows: SavedCopy[] = copies.map((copy) => ({
    ...copy,
    userId,
    brand: req.brand,
    network: req.network,
    topic: req.topic,
    audience: req.audience,
    tone: req.tone,
    goal: req.goal,
    createdAt: new Date().toISOString(),
  }));

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase.from("post_copies").insert(
      rows.map((row) => ({
        id: row.id,
        user_id: userId,
        brand: row.brand,
        network: row.network,
        topic: row.topic,
        audience: row.audience,
        tone: row.tone,
        goal: row.goal,
        headline: row.headline,
        body: row.body,
        hashtags: row.hashtags,
        cta: row.cta,
        notes: row.notes,
      })),
    );
    if (!error) return rows;
    if (!isMissingTable(error)) throw new Error(error.message);
  }

  writeLocal(COPIES_KEY, [...rows, ...readLocal<SavedCopy>(COPIES_KEY)].slice(0, 80));
  return rows;
}

export async function listSavedCopies(userId: string): Promise<SavedCopy[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("post_copies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (!error && data) {
      return data.map((row) => ({
        id: row.id,
        headline: row.headline,
        body: row.body,
        hashtags: row.hashtags ?? [],
        cta: row.cta,
        notes: row.notes,
        userId: row.user_id,
        brand: row.brand,
        network: row.network,
        topic: row.topic,
        audience: row.audience,
        tone: row.tone,
        goal: row.goal,
        createdAt: row.created_at,
      }));
    }
    if (error && !isMissingTable(error)) throw new Error(error.message);
  }
  return readLocal<SavedCopy>(COPIES_KEY).filter((c) => c.userId === userId);
}

export async function saveGeneratedScript(req: ScriptRequest, script: GeneratedScript, userId: string) {
  const row: SavedScript = {
    ...script,
    userId,
    brand: req.brand,
    format: req.format,
    duration: req.duration,
    topic: req.topic,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase.from("video_scripts").insert({
      id: row.id,
      user_id: userId,
      brand: row.brand,
      format: row.format,
      duration: row.duration,
      topic: row.topic,
      audience: req.audience,
      tone: req.tone,
      goal: req.goal,
      title: row.title,
      hook: row.hook,
      scenes: row.scenes,
      cta: row.cta,
      caption: row.caption,
      hashtags: row.hashtags,
    });
    if (!error) return row;
    if (!isMissingTable(error)) throw new Error(error.message);
  }

  writeLocal(SCRIPTS_KEY, [row, ...readLocal<SavedScript>(SCRIPTS_KEY)].slice(0, 40));
  return row;
}

export async function listSavedScripts(userId: string): Promise<SavedScript[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("video_scripts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) {
      return data.map((row) => ({
        id: row.id,
        title: row.title,
        hook: row.hook,
        scenes: row.scenes ?? [],
        cta: row.cta,
        caption: row.caption,
        hashtags: row.hashtags ?? [],
        userId: row.user_id,
        brand: row.brand,
        format: row.format,
        duration: row.duration,
        topic: row.topic,
        createdAt: row.created_at,
      }));
    }
    if (error && !isMissingTable(error)) throw new Error(error.message);
  }
  return readLocal<SavedScript>(SCRIPTS_KEY).filter((s) => s.userId === userId);
}

export async function saveWeeklyReport(report: WeeklyReport, userId: string) {
  const stored = { ...report };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase.from("weekly_reports").insert({
      id: stored.id,
      user_id: userId,
      week_label: stored.weekLabel,
      start_date: stored.startDate,
      end_date: stored.endDate,
      client: stored.client,
      highlights: stored.highlights,
      recommendations: stored.recommendations,
    });
    if (!error) {
      if (stored.posts.length) {
        const { error: postsError } = await supabase.from("report_posts").insert(
          stored.posts.map((post) => ({
            id: post.id,
            report_id: stored.id,
            user_id: userId,
            title: post.title,
            network: post.network,
            published_at: post.publishedAt,
            reach: post.reach,
            impressions: post.impressions,
            likes: post.likes,
            comments: post.comments,
            shares: post.shares,
            saves: post.saves,
            clicks: post.clicks,
            engagement_rate: post.engagementRate,
          })),
        );
        if (postsError && !isMissingTable(postsError)) throw new Error(postsError.message);
      }
      return stored;
    }
    if (!isMissingTable(error)) throw new Error(error.message);
  }

  const all = [stored, ...readLocal<WeeklyReport & { userId?: string }>(REPORTS_KEY)];
  writeLocal(REPORTS_KEY, all.map((r) => ({ ...r, userId })).slice(0, 40));
  return stored;
}

export async function listWeeklyReports(userId: string): Promise<WeeklyReport[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false });
    if (!error && data) {
      const ids = data.map((r) => r.id);
      const { data: posts } = ids.length
        ? await supabase.from("report_posts").select("*").in("report_id", ids)
        : { data: [] as never[] };
      const postsByReport = new Map<string, PostPerformance[]>();
      for (const row of posts ?? []) {
        const list = postsByReport.get(row.report_id) ?? [];
        list.push({
          id: row.id,
          title: row.title,
          network: row.network,
          publishedAt: row.published_at,
          reach: row.reach,
          impressions: row.impressions,
          likes: row.likes,
          comments: row.comments,
          shares: row.shares,
          saves: row.saves,
          clicks: row.clicks,
          engagementRate: Number(row.engagement_rate),
        });
        postsByReport.set(row.report_id, list);
      }
      return data.map((row) => {
        const reportPosts = postsByReport.get(row.id) ?? [];
        return {
          id: row.id,
          weekLabel: row.week_label,
          startDate: row.start_date,
          endDate: row.end_date,
          client: row.client,
          posts: reportPosts,
          networks: buildNetworkSummaries(reportPosts),
          highlights: row.highlights ?? [],
          recommendations: row.recommendations ?? [],
        };
      });
    }
    if (error && !isMissingTable(error)) throw new Error(error.message);
  }

  return readLocal<WeeklyReport & { userId?: string }>(REPORTS_KEY)
    .filter((r) => !r.userId || r.userId === userId)
    .map(({ userId: _u, ...report }) => report);
}

export async function addPostToReport(reportId: string, post: PostPerformance, userId: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase.from("report_posts").insert({
      id: post.id,
      report_id: reportId,
      user_id: userId,
      title: post.title,
      network: post.network,
      published_at: post.publishedAt,
      reach: post.reach,
      impressions: post.impressions,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      saves: post.saves,
      clicks: post.clicks,
      engagement_rate: post.engagementRate,
    });
    if (!error) return;
    if (!isMissingTable(error)) throw new Error(error.message);
  }

  const all = readLocal<WeeklyReport & { userId?: string }>(REPORTS_KEY).map((report) => {
    if (report.id !== reportId) return report;
    const posts = [...report.posts, post];
    const insights = autoInsights(posts);
    return {
      ...report,
      posts,
      networks: buildNetworkSummaries(posts),
      highlights: report.highlights.length ? report.highlights : insights.highlights,
      recommendations: report.recommendations.length ? report.recommendations : insights.recommendations,
    };
  });
  writeLocal(REPORTS_KEY, all);
}

export { currentUserId };
