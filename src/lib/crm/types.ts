import type {
  ContentCalendar,
  ContentStrategy,
  ProfileAnalysis,
  SocialNetwork,
} from "@/lib/types/studio";
import type { SavedMail } from "@/lib/mail/types";
import type { SavedCopy, SavedScript } from "@/lib/studio/persist";
import type { WeeklyReport } from "@/lib/types/studio";

export type ClientStatus = "active" | "paused" | "archived";

export interface ClientNetwork {
  id: string;
  clientId: string;
  network: SocialNetwork;
  handle: string;
  url: string;
  createdAt: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  brand: string;
  industry: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
  networks: ClientNetwork[];
}

export interface ClientInput {
  name: string;
  brand?: string;
  industry?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
  status?: ClientStatus;
}

export interface SavedAnalysis {
  id: string;
  clientId: string;
  userId: string;
  createdAt: string;
  analysis: ProfileAnalysis;
}

export interface SavedStrategy {
  id: string;
  clientId: string;
  userId: string;
  createdAt: string;
  strategy: ContentStrategy;
}

export interface SavedCalendar {
  id: string;
  clientId: string;
  userId: string;
  createdAt: string;
  calendar: ContentCalendar;
}

export interface ClientWorkspace {
  client: Client;
  analyses: SavedAnalysis[];
  strategies: SavedStrategy[];
  calendars: SavedCalendar[];
  copies: SavedCopy[];
  scripts: SavedScript[];
  reports: WeeklyReport[];
  mails: SavedMail[];
}

export const STATUS_LABELS: Record<ClientStatus, string> = {
  active: "Activo",
  paused: "En pausa",
  archived: "Archivado",
};
