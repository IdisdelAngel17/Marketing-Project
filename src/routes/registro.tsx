import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AuthPageFrame, GuestOnly } from "@/components/auth/auth-guards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [{ title: "Crear cuenta | Community Manager IA" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <GuestOnly>
      <RegisterForm />
    </GuestOnly>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await register({
        name: String(data.get("name") || ""),
        email: String(data.get("email") || ""),
        password: String(data.get("password") || ""),
        agency: String(data.get("agency") || ""),
      });
      toast.success("Cuenta creada. Bienvenido al estudio.");
      void navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageFrame
      title="Crea tu cuenta"
      subtitle="Regístrate gratis y accede a tu dashboard personalizado."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/iniciar-sesion"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required placeholder="Tu nombre" autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agency">Agencia o marca</Label>
          <Input id="agency" name="agency" placeholder="Ej. Estudio Norte" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="tu@agencia.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full rounded-full">
          {loading ? <Loader2 className="animate-spin" /> : null}
          Registrarme y ver dashboard
        </Button>
      </form>
    </AuthPageFrame>
  );
}
