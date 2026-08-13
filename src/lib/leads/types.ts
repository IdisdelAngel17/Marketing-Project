export const LEAD_SOURCES = {
  landing: "Landing",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  referral: "Referido",
  other: "Otro",
} as const;

export type LeadSource = keyof typeof LEAD_SOURCES;

export const LEAD_INTERESTS = {
  estudio: "Plan Estudio",
  agencia: "Plan Agencia",
  custom: "A medida",
  demo: "Ver demo",
  other: "Otro",
} as const;

export type LeadInterest = keyof typeof LEAD_INTERESTS;

export const LEAD_STATUSES = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  won: "Convertido",
  lost: "Descartado",
} as const;

export type LeadStatus = keyof typeof LEAD_STATUSES;

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: LeadSource;
  interest: LeadInterest;
  message: string;
  status: LeadStatus;
  notes: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: LeadSource;
  interest?: LeadInterest;
  message?: string;
}
