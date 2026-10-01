import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=checking, false=anon, obj=logged in

  const check = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      if (data && data.email) {
        setUser(data);
      } else {
        setUser(false);
      }
    } catch {
      setUser(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data?.token || data?.access_token) {
      try {
        localStorage.setItem("sbb_access_token", data.token || data.access_token);
      } catch {}
    }
    setUser(data);
    return data;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    try { localStorage.removeItem("sbb_access_token"); } catch {}
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, check }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { formatApiErrorDetail };
