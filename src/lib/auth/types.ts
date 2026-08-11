export type UserRole = "admin" | "member";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agency: string;
  createdAt: string;
}

export interface StoredUser extends AuthUser {
  passwordHash: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  agency: string;
}

export interface CreateUserInput extends RegisterInput {
  role: UserRole;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  member: "Miembro",
};
