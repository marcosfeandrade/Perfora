"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  AuthUser,
  getToken,
  getStoredUser,
  setStoredUser,
  setToken,
  clearToken,
} from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.auth.me();
      setUser(me);
      setStoredUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const stored = getStoredUser();
      if (stored) setUser(stored);
      loadUser();
    } else {
      setLoading(false);
    }
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.auth.login({ email, password });
      setToken(res.accessToken);
      setUser(res.user);
      setStoredUser(res.user);
      router.push("/");
    },
    [router]
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const res = await api.auth.register({ email, password, name });
      setToken(res.accessToken);
      setUser(res.user);
      setStoredUser(res.user);
      router.push("/");
    },
    [router]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
