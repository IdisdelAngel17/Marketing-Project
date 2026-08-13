export const MAIL_TEMPLATES = {
  custom: {
    label: "Personalizado",
    subject: "",
    body: "",
  },
  welcome: {
    label: "Bienvenida",
    subject: "Arrancamos juntos tu contenido",
    body: "Hola {{contacto}},\n\nYa tenemos lista tu ficha en {{agencia}} para {{cliente}}.\n\nEn los próximos días te compartimos análisis, estrategia y calendario.\n\nCualquier duda, responde este correo.\n\nSaludos,\n{{remitente}}",
  },
  weekly: {
    label: "Reporte semanal",
    subject: "Tu reporte semanal de {{cliente}}",
    body: "Hola {{contacto}},\n\nTe compartimos el resumen de la semana para {{cliente}}.\n\nHighlights:\n- \n\nRecomendaciones:\n- \n\nSi quieres ajustar el plan, responde este correo.\n\nSaludos,\n{{remitente}}",
  },
  approval: {
    label: "Aprobación de contenido",
    subject: "Contenido listo para revisar · {{cliente}}",
    body: "Hola {{contacto}},\n\nYa tienes copies / calendario listos para {{cliente}}.\n\nRevisa y dinos si apruebas o qué cambiamos.\n\nSaludos,\n{{remitente}}",
  },
  followup: {
    label: "Seguimiento",
    subject: "Seguimiento de {{cliente}}",
    body: "Hola {{contacto}},\n\nTe escribo para dar seguimiento a {{cliente}} y confirmar próximos pasos.\n\nQuedo atento.\n\nSaludos,\n{{remitente}}",
  },
} as const;

export type MailTemplateId = keyof typeof MAIL_TEMPLATES;

export type MailStatus = "sent" | "failed";

export interface SavedMail {
  id: string;
  userId: string;
  clientId?: string;
  clientName?: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  template: MailTemplateId;
  status: MailStatus;
  resendId?: string;
  error?: string;
  createdAt: string;
}

export function applyMailTemplate(
  templateId: MailTemplateId,
  vars: {
    contacto?: string;
    cliente?: string;
    agencia?: string;
    remitente?: string;
  },
) {
  const tpl = MAIL_TEMPLATES[templateId];
  const replace = (text: string) =>
    text
      .replaceAll("{{contacto}}", vars.contacto || "equipo")
      .replaceAll("{{cliente}}", vars.cliente || "tu marca")
      .replaceAll("{{agencia}}", vars.agencia || "nuestra agencia")
      .replaceAll("{{remitente}}", vars.remitente || "Community Manager IA");
  return {
    subject: replace(tpl.subject),
    body: replace(tpl.body),
  };
}
