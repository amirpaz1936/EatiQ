import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest, ApiError } from "../api/client";
import type { User } from "../types/user";
import { clearToken, getToken, setToken } from "./auth-storage";

type AuthResponse = {
  accessToken: string;
  user: { id: string; email: string; name: string | null };
};

type MeResponse = {
  id: string;
  email: string;
  name: string | null;
  hasPassword: boolean;
  hasGoogle: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080")
  .replace(/\/+$/, "");

function toUser(m: { email: string; name: string | null }): User {
  return { email: m.email, name: m.name ?? deriveNameFromEmail(m.email) };
}

function deriveNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return (
    local
      .split(/[._-]/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ") || email
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const me = await apiRequest<MeResponse>("/auth/me", { auth: true });
    setUser(toUser(me));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (window.location.pathname === "/auth/callback") {
          const params = new URLSearchParams(window.location.search);
          const token = params.get("token");
          if (token) {
            setToken(token);
            await fetchMe();
          }
          window.history.replaceState({}, "", "/");
        } else if (getToken()) {
          await fetchMe();
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) clearToken();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(res.accessToken);
      setUser(toUser(res.user));
    },
    [],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      setToken(res.accessToken);
      setUser(toUser(res.user));
    },
    [],
  );

  const loginWithGoogle = useCallback(() => {
    window.location.href = `${API_BASE}/auth/google`;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, loginWithGoogle, logout }),
    [user, loading, login, register, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
