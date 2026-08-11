import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLE_LABELS, type UserRole } from "@/lib/auth/types";

export const Route = createFileRoute("/app/usuarios")({
  head: () => ({
    meta: [{ title: "Usuarios | Community Manager IA" }],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { user, users, isAdmin, addUser, removeUser } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("member");
  const [loading, setLoading] = useState(false);

  if (user && !isAdmin) {
    return (
      <AppShell title="Usuarios" description="Solo administradores pueden gestionar el equipo.">
        <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">
          Tu cuenta no tiene permisos de administrador. Pide acceso a un admin del equipo.
          <div className="mt-4">
            <Button variant="outline" className="rounded-full" onClick={() => void navigate({ to: "/app" })}>
              Volver al dashboard
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setLoading(true);
    try {
      await addUser({
        name: String(data.get("name") || ""),
        email: String(data.get("email") || ""),
        password: String(data.get("password") || ""),
        agency: String(data.get("agency") || user?.agency || ""),
        role,
      });
      toast.success("Usuario agregado");
      form.reset();
      setRole("member");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Usuarios"
      description="Agrega miembros del equipo y gestiona quién entra al dashboard."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/40">
              <UserPlus className="h-5 w-5 text-primary-foreground" />
            </span>
            <div>
              <h2 className="font-semibold">Agregar usuario</h2>
              <p className="text-xs text-muted-foreground">Crea una cuenta lista para iniciar sesión.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required placeholder="Nombre completo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" name="email" type="email" required placeholder="correo@agencia.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agency">Agencia o marca</Label>
            <Input
              id="agency"
              name="agency"
              defaultValue={user?.agency}
              placeholder="Nombre de la agencia"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña temporal</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Miembro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-full">
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus />}
            Agregar al equipo
          </Button>
        </form>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-semibold">Equipo ({users.length})</h2>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.agency}</p>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {member.id === user?.id ? (
                        <span className="text-xs text-muted-foreground">Tú</span>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            void (async () => {
                              try {
                                await removeUser(member.id);
                                toast.success("Usuario eliminado del equipo");
                              } catch (err) {
                                toast.error(
                                  err instanceof Error ? err.message : "No se pudo eliminar",
                                );
                              }
                            })();
                          }}
                        >
                          <Trash2 />
                          Quitar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
