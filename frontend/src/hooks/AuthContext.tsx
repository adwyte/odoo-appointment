import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
import type { User } from "../services/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const me = await api.getMe();

        if (!cancelled && me) {
          /**
           * Normalize user object so Header & Sidebar always work
           */
          setUser({
            id: me.id,
            email: me.email,
            full_name:
              me.full_name ||
              me.email?.split("@")[0] ||
              "User",
            role: me.role,
            is_active: true,
            is_verified: true,
            created_at: null,
          });
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }
  return ctx;
}
