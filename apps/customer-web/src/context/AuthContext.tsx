import type { AuthResponse, AuthUser } from "@delivery/shared-types";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { clearSession, getSession, saveSession } from "../lib/session";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getSession().user);
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
    saveSession(data);
    setUser(data.user);
  }

  async function register(name: string, email: string, password: string) {
    const { data } = await api.post<AuthResponse>("/auth/register", {
      name,
      email,
      password,
      role: "CUSTOMER",
    });
    saveSession(data);
    setUser(data.user);
  }

  function logout() {
    // Revoke the refresh token on the server too, so it can't be used after sign-out.
    const { refreshToken } = getSession();
    clearSession();
    setUser(null);
    if (refreshToken) {
      api.post("/auth/logout", { refreshToken }).catch(() => {});
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
