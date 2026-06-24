import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Role = "SYSTEM.ADMIN" | "SUPERVISOR" | "OFFICER" | "RECRUIT";

export interface User {
  discordId: string;
  discordUsername: string;
  displayName: string;
  avatar: string | null;
  callsign: string;
  role: Role;
  memberId: number | null;
}

export const ROLE_LABELS: Record<Role, string> = {
  "SYSTEM.ADMIN": "System Admin",
  SUPERVISOR: "Supervisor",
  OFFICER: "Officer",
  RECRUIT: "Recruit",
};

export const ROLE_INITIALS: Record<Role, string> = {
  "SYSTEM.ADMIN": "SA",
  SUPERVISOR: "SV",
  OFFICER: "OF",
  RECRUIT: "RC",
};

export const ALLOWED_ROUTES: Record<Role, string[]> = {
  "SYSTEM.ADMIN": [
    "/",
    "/members",
    "/ranks",
    "/departments",
    "/patrol-logs",
    "/applications",
    "/disciplinary",
    "/activity",
    "/whitelist",
    "/careers",
  ],
  SUPERVISOR: [
    "/",
    "/members",
    "/ranks",
    "/departments",
    "/patrol-logs",
    "/applications",
    "/disciplinary",
    "/activity",
    "/careers",
  ],
  OFFICER: ["/", "/members", "/patrol-logs", "/activity", "/careers"],
  RECRUIT: ["/", "/patrol-logs"],
};

const API_BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  canAccess: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then(({ user }) => setUser(user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setUser(null);
  }

  function canAccess(path: string): boolean {
    if (!user) return false;
    const allowed = ALLOWED_ROUTES[user.role];
    if (path === "/") return allowed.includes("/");
    return allowed.some((r) => r === path || (r !== "/" && path.startsWith(r)));
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
