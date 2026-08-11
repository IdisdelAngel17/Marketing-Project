import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthPageFrame, GuestOnly } from "@/components/auth/auth-guards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";

const searchSchema = z.object({
  redirect: z.string().optional().catch("/app"),
});

export const Route = createFileRoute("/iniciar-sesion")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Iniciar sesión | Community Manager IA" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <GuestOnly>
      <LoginForm />
    </GuestOnly>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await login(String(data.get("email") || ""), String(data.get("password") || ""));
      toast.success("Sesión iniciada");
      void navigate({ to: redirect || "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageFrame
      title="Inicia sesión"
      subtitle="Entra a tu dashboard para crear copies, guiones y ver reportes."
      footer={
        <>
          ¿Aún no tienes cuenta?{" "}
          <Link to="/registro" className="font-medium text-foreground underline-offset-4 hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@agencia.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full rounded-full">
          {loading ? <Loader2 className="animate-spin" /> : null}
          Entrar al dashboard
        </Button>
        <p className="rounded-2xl bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
          Auth conectada a Supabase. El primer usuario registrado se convierte en admin.
        </p>
      </form>
    </AuthPageFrame>
  );
}
