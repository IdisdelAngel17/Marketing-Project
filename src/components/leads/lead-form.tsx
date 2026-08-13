import { Loader2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

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
import { submitLead } from "@/lib/leads/submit";
import {
  LEAD_INTERESTS,
  LEAD_SOURCES,
  type LeadInterest,
  type LeadSource,
} from "@/lib/leads/types";
import { cn } from "@/lib/utils";

export function LeadForm({
  className,
  defaultSource = "landing",
  defaultInterest = "demo",
  compact = false,
  onCreated,
}: {
  className?: string;
  defaultSource?: LeadSource;
  defaultInterest?: LeadInterest;
  compact?: boolean;
  onCreated?: () => void;
}) {
  const [source, setSource] = useState<LeadSource>(defaultSource);
  const [interest, setInterest] = useState<LeadInterest>(defaultInterest);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setLoading(true);
    try {
      const payload = {
        name: String(data.get("name") || ""),
        email: String(data.get("email") || ""),
        phone: String(data.get("phone") || ""),
        company: String(data.get("company") || ""),
        source,
        interest,
        message: String(data.get("message") || ""),
      };
      await submitLead({ data: payload });
      toast.success("Lead guardado. Ya aparece en el inbox.");
      form.reset();
      setSource(defaultSource);
      setInterest(defaultInterest);
      setSent(true);
      onCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar el formulario");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className={cn("rounded-3xl border border-border bg-card p-6 text-sm", className)}>
        <p className="font-semibold">¡Listo! Ya está en nuestro inbox.</p>
        <p className="mt-2 text-muted-foreground">
          Te escribimos por correo o WhatsApp para agendar la demo.
        </p>
        <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={() => setSent(false)}>
          Enviar otro lead
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)}>
      <div className={cn("grid gap-4", compact ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
        <div className="space-y-2">
          <Label htmlFor="lead-name">Nombre</Label>
          <Input id="lead-name" name="name" required placeholder="Tu nombre" autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-email">Correo</Label>
          <Input
            id="lead-email"
            name="email"
            type="email"
            required
            placeholder="correo@marca.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-phone">WhatsApp / teléfono</Label>
          <Input id="lead-phone" name="phone" placeholder="614 000 0000" autoComplete="tel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-company">Agencia o marca</Label>
          <Input id="lead-company" name="company" placeholder="Ej. Estudio Norte" />
        </div>
        <div className="space-y-2">
          <Label>Origen</Label>
          <Select value={source} onValueChange={(v) => setSource(v as LeadSource)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LEAD_SOURCES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Interés</Label>
          <Select value={interest} onValueChange={(v) => setInterest(v as LeadInterest)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LEAD_INTERESTS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-message">¿Qué necesitas?</Label>
        <Textarea
          id="lead-message"
          name="message"
          className="min-h-24"
          placeholder="Cuéntanos cuántos clientes manejas y qué quieres resolver."
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full rounded-full">
        {loading ? <Loader2 className="animate-spin" /> : <Send />}
        {loading ? "Enviando…" : "Enviar solicitud"}
      </Button>
    </form>
  );
}
