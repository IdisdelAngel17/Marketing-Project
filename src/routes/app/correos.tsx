import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Mail, Send } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { ClientPicker, ClientWorkBanner, useAgencyClients } from "@/components/crm/client-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth-context";
import { clientSearchSchema } from "@/lib/crm/search";
import { listSentMails, saveSentMail } from "@/lib/mail/persist";
import { getMailConfig, sendResendEmail } from "@/lib/mail/send-email";
import {
  applyMailTemplate,
  MAIL_TEMPLATES,
  type MailTemplateId,
  type SavedMail,
} from "@/lib/mail/types";

export const Route = createFileRoute("/app/correos")({
  validateSearch: clientSearchSchema,
  head: () => ({
    meta: [{ title: "Correos | Community Manager IA" }],
  }),
  component: MailPage,
});

function slugId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function MailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { client: clientId } = Route.useSearch();
  const { selected } = useAgencyClients();
  const activeClient = selected(clientId);
  const [template, setTemplate] = useState<MailTemplateId>("welcome");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SavedMail[]>([]);
  const [mailReady, setMailReady] = useState<boolean | null>(null);
  const [fromLabel, setFromLabel] = useState("");

  const vars = useMemo(
    () => ({
      contacto: activeClient?.contactName || activeClient?.name || "equipo",
      cliente: activeClient?.name || "tu marca",
      agencia: user?.agency || "nuestra agencia",
      remitente: user?.name || "Community Manager IA",
    }),
    [activeClient, user],
  );

  useEffect(() => {
    const filled = applyMailTemplate(template, vars);
    if (template !== "custom") {
      setSubject(filled.subject);
      setBody(filled.body);
    }
  }, [template, vars]);

  useEffect(() => {
    setTo(activeClient?.email || "");
  }, [activeClient?.id, activeClient?.email]);

  useEffect(() => {
    if (!user) return;
    void listSentMails(user.id, clientId).then(setHistory).catch(() => setHistory([]));
  }, [user, clientId]);

  useEffect(() => {
    void getMailConfig()
      .then((cfg) => {
        setMailReady(cfg.configured);
        setFromLabel(cfg.from);
      })
      .catch(() => setMailReady(false));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setSending(true);
    try {
      const result = await sendResendEmail({
        data: {
          to: to.trim(),
          cc: cc.trim() || undefined,
          subject: subject.trim(),
          html: body.trim(),
          replyTo: user.email,
        },
      });
      const saved: SavedMail = {
        id: slugId("mail"),
        userId: user.id,
        clientId,
        clientName: activeClient?.name,
        to,
        cc: cc || undefined,
        subject,
        body,
        template,
        status: "sent",
        resendId: result.id,
        createdAt: new Date().toISOString(),
      };
      await saveSentMail(saved);
      setHistory((prev) => [saved, ...prev].slice(0, 40));
      toast.success(`Correo enviado a ${to}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo enviar";
      if (user) {
        const failed: SavedMail = {
          id: slugId("mail"),
          userId: user.id,
          clientId,
          clientName: activeClient?.name,
          to,
          cc: cc || undefined,
          subject,
          body,
          template,
          status: "failed",
          error: message,
          createdAt: new Date().toISOString(),
        };
        await saveSentMail(failed).catch(() => undefined);
        setHistory((prev) => [failed, ...prev].slice(0, 40));
      }
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell
      title="Correos"
      description="Envía correos a clientes o al equipo con Resend, agrupados por ficha CRM."
    >
      <ClientWorkBanner client={activeClient} />
      {mailReady === false ? (
        <div className="mb-6 rounded-3xl border border-accent/50 bg-accent/30 px-5 py-4 text-sm">
          <p className="font-semibold">Resend pendiente de configurar</p>
          <p className="mt-1 text-muted-foreground">
            Agrega <code className="rounded bg-surface px-1.5 py-0.5 text-xs">VITE_RESEND_API_KEY</code> en{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 text-xs">.env</code> y, si tienes dominio
            verificado, <code className="rounded bg-surface px-1.5 py-0.5 text-xs">VITE_RESEND_FROM</code>.
            Sin dominio usa <code className="rounded bg-surface px-1.5 py-0.5 text-xs">beth.t@example.com</code>{" "}
            y envía solo a tu propio correo de Resend.
          </p>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/40">
              <Mail className="h-5 w-5 text-primary-foreground" />
            </span>
            <div>
              <h2 className="font-semibold">Nuevo correo</h2>
              <p className="text-xs text-muted-foreground">
                {fromLabel ? `Desde ${fromLabel}` : "Se envía con tu clave de Resend."}
              </p>
            </div>
          </div>

          <ClientPicker
            value={clientId}
            onChange={(id) => void navigate({ to: "/app/correos", search: { client: id } })}
          />

          <div className="space-y-2">
            <Label>Plantilla</Label>
            <Select value={template} onValueChange={(v) => setTemplate(v as MailTemplateId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MAIL_TEMPLATES).map(([id, tpl]) => (
                  <SelectItem key={id} value={id}>
                    {tpl.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="to">Para</Label>
              <Input
                id="to"
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="cliente@marca.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc">CC (opcional)</Label>
              <Input
                id="cc"
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="equipo@agencia.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input
              id="subject"
              required
              value={subject}
              onChange={(e) => {
                setTemplate("custom");
                setSubject(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Mensaje</Label>
            <Textarea
              id="body"
              required
              className="min-h-48"
              value={body}
              onChange={(e) => {
                setTemplate("custom");
                setBody(e.target.value);
              }}
            />
          </div>
          <Button type="submit" disabled={sending || mailReady === false} className="w-full rounded-full">
            {sending ? <Loader2 className="animate-spin" /> : <Send />}
            {sending ? "Enviando…" : "Enviar con Resend"}
          </Button>
        </form>

        <div className="space-y-3">
          <h2 className="font-semibold">Historial</h2>
          {history.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border p-8 text-sm text-muted-foreground">
              Aún no hay correos {clientId ? "de este cliente" : "enviados"}.
            </p>
          ) : (
            history.map((mail) => (
              <article key={mail.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{mail.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Para {mail.to}
                      {mail.clientName ? ` · ${mail.clientName}` : ""}
                      {" · "}
                      {mail.createdAt.slice(0, 10)}
                    </p>
                  </div>
                  <Badge variant={mail.status === "sent" ? "secondary" : "destructive"}>
                    {mail.status === "sent" ? "Enviado" : "Falló"}
                  </Badge>
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{mail.body}</p>
                {mail.error ? <p className="mt-2 text-xs text-destructive">{mail.error}</p> : null}
              </article>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
