import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  createUserByAdmin,
  deleteUser,
  getSessionUser,
  listUsers,
  loginUser,
  logoutUser,
  onAuthStateChange,
  registerUser,
} from "@/lib/auth/supabase-auth";
import type {
  AuthUser,
  CreateUserInput,
  RegisterInput,
  UserRole,
} from "@/lib/auth/types";
import { getSupabaseConfigError, isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthContextValue {
  user: AuthUser | null;
  users: AuthUser[];
  ready: boolean;
  configured: boolean;
  configError: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  addUser: (input: CreateUserInput) => Promise<AuthUser>;
  removeUser: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [ready, setReady] = useState(false);
  const configured = isSupabaseConfigured();
  const configError = getSupabaseConfigError();

  const refreshUsers = useCallback(async () => {
    if (!configured) {
      setUsers([]);
      return;
    }
    try {
      const list = await listUsers();
      setUsers(list);
    } catch {
      setUsers([]);
    }
  }, [configured]);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    void (async () => {
      if (!configured) {
        if (active) setReady(true);
        return;
      }

      try {
        const sessionUser = await getSessionUser();
        if (!active) return;
        setUser(sessionUser);
        if (sessionUser) {
          await refreshUsers();
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setReady(true);
      }

      unsubscribe = onAuthStateChange((next) => {
        setUser(next);
        if (next) {
          void refreshUsers();
        } else {
          setUsers([]);
        }
      });
    })();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [configured, refreshUsers]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      users,
      ready,
      configured,
      configError,
      isAdmin: user?.role === "admin",
      refreshUsers,
      async login(email, password) {
        const next = await loginUser(email, password);
        setUser(next);
        await refreshUsers();
        return next;
      },
      async register(input) {
        const next = await registerUser(input);
        setUser(next);
        await refreshUsers();
        return next;
      },
      async logout() {
        await logoutUser();
        setUser(null);
        setUsers([]);
      },
      async addUser(input) {
        const created = await createUserByAdmin(input);
        await refreshUsers();
        return created;
      },
      async removeUser(userId) {
        if (!user) return;
        await deleteUser(userId, user.id);
        await refreshUsers();
      },
    }),
    [user, users, ready, configured, configError, refreshUsers],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}

export function useRequireRole(role?: UserRole) {
  const auth = useAuth();
  if (!role) return auth.isAdmin;
  return auth.user?.role === role;
}
