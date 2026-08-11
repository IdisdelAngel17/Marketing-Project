import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabasePublishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as
  | string
  | undefined;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl?.trim() && supabasePublishableKey?.trim());
}

export function getSupabaseConfigError() {
  if (!supabaseUrl?.trim()) {
    return "Falta VITE_SUPABASE_URL en el archivo .env";
  }
  if (!supabasePublishableKey?.trim()) {
    return "Falta VITE_SUPABASE_PUBLISHABLE_KEY en el archivo .env (cópiala desde Supabase → Connect)";
  }
  return null;
}

let browserClient: SupabaseClient | null = null;

export function getSupabase() {
  const configError = getSupabaseConfigError();
  if (configError) {
    throw new Error(configError);
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

/** Cliente sin persistir sesión: sirve para que un admin cree cuentas sin cerrar la suya. */
export function createEphemeralSupabase() {
  const configError = getSupabaseConfigError();
  if (configError) {
    throw new Error(configError);
  }

  return createClient(supabaseUrl!, supabasePublishableKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    },
  });
}
