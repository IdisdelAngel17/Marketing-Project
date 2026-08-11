import { createEphemeralSupabase, getSupabase } from "@/lib/supabase/client";
import type {
  AuthUser,
  CreateUserInput,
  RegisterInput,
  UserRole,
} from "@/lib/auth/types";

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  agency: string;
  role: UserRole;
  created_at: string;
};

function mapProfile(row: ProfileRow): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    agency: row.agency,
    role: row.role,
    createdAt: row.created_at,
  };
}

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, agency, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  return mapProfile(data as ProfileRow);
}

async function ensureProfileFromSession(): Promise<AuthUser | null> {
  const supabase = getSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }
  if (!user) return null;

  let profile = await fetchProfile(user.id);
  if (profile) return profile;

  // Fallback si el trigger aún no corrió
  const { error: insertError } = await supabase.from("profiles").upsert({
    id: user.id,
    name:
      (user.user_metadata?.["name"] as string | undefined) ||
      user.email?.split("@")[0] ||
      "Usuario",
    email: (user.email || "").toLowerCase(),
    agency: (user.user_metadata?.["agency"] as string | undefined) || "Mi agencia",
    role: (user.user_metadata?.["role"] as UserRole | undefined) || "member",
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  profile = await fetchProfile(user.id);
  return profile;
}

export async function getSessionUser(): Promise<AuthUser | null> {
  return ensureProfileFromSession();
}

export async function listUsers(): Promise<AuthUser[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, agency, role, created_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as ProfileRow[]).map(mapProfile);
}

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  const supabase = getSupabase();
  const email = input.email.trim().toLowerCase();

  if (!input.name.trim() || !email || !input.password) {
    throw new Error("Completa nombre, correo y contraseña.");
  }
  if (input.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        name: input.name.trim(),
        agency: input.agency.trim() || "Mi agencia",
        role: "member",
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error("No se pudo crear la cuenta.");
  }

  // Si Confirm email está activo, puede no haber sesión todavía
  if (!data.session) {
    throw new Error(
      "Cuenta creada. Revisa tu correo para confirmar, o desactiva “Confirm email” en Supabase → Authentication → Providers.",
    );
  }

  const profile = await ensureProfileFromSession();
  if (!profile) {
    throw new Error("Cuenta creada, pero no se encontró el perfil.");
  }
  return profile;
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(
      error.message === "Invalid login credentials"
        ? "Correo o contraseña incorrectos."
        : error.message,
    );
  }

  const profile = await ensureProfileFromSession();
  if (!profile) {
    throw new Error("Inicio de sesión correcto, pero falta el perfil en la tabla profiles.");
  }
  return profile;
}

export async function logoutUser() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function createUserByAdmin(input: CreateUserInput): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim() || !email || !input.password) {
    throw new Error("Completa nombre, correo y contraseña.");
  }
  if (input.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const ephemeral = createEphemeralSupabase();
  const { data, error } = await ephemeral.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        name: input.name.trim(),
        agency: input.agency.trim() || "Mi agencia",
        role: input.role,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error("No se pudo crear el usuario.");
  }

  // Esperar un momento al trigger y leer desde el cliente autenticado (admin)
  await new Promise((r) => setTimeout(r, 400));
  const users = await listUsers();
  const created = users.find((u) => u.email === email);
  if (!created) {
    throw new Error(
      "Usuario creado en Auth. Si no aparece en la lista, ejecuta el SQL de profiles y recarga.",
    );
  }

  // Si el trigger puso member por defecto y pedimos admin (y no es el primero), actualizar
  if (created.role !== input.role) {
    const supabase = getSupabase();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: input.role, name: input.name.trim(), agency: input.agency.trim() || created.agency })
      .eq("id", created.id);
    if (updateError) {
      throw new Error(updateError.message);
    }
    return { ...created, role: input.role, name: input.name.trim() };
  }

  return created;
}

export async function deleteUser(userId: string, currentUserId: string) {
  if (userId === currentUserId) {
    throw new Error("No puedes eliminar tu propia cuenta desde aquí.");
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) {
    throw new Error(error.message);
  }
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  const supabase = getSupabase();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    void (async () => {
      if (!session?.user) {
        callback(null);
        return;
      }
      try {
        const profile = await fetchProfile(session.user.id);
        callback(profile);
      } catch {
        callback(null);
      }
    })();
  });
  return () => data.subscription.unsubscribe();
}
