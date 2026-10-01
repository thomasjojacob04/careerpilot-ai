import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem("cp_token"));

  useEffect(() => {
    if (!localStorage.getItem("cp_token")) return;
    api.get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem("cp_token"))
      .finally(() => setLoading(false));
  }, []);

  const save = ({ token, user }) => {
    localStorage.setItem("cp_token", token);
    setUser(user);
    return user;
  };
  const login = async (email, password) => save((await api.post("/auth/login", { email, password })).data);
  const register = async (form) => save((await api.post("/auth/register", form)).data);
  const refresh = () => api.get("/auth/me").then((r) => setUser(r.data.user)).catch(() => {});
  const logout = () => {
    localStorage.removeItem("cp_token");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
}
