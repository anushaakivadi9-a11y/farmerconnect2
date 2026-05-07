import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Role } from "@/data/mockData";
import axios from "axios";

// 1. Updated User interface to match your Backend (likely includes id)
interface User {
  id?: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

// Set your backend base URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if we have a saved token
  useEffect(() => {
    const rawUser = localStorage.getItem("fc_user");
    const token = localStorage.getItem("fc_token");
    if (rawUser && token) {
      setUser(JSON.parse(rawUser));
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setIsLoading(false);
  }, []);

  // Updated login to talk to the Backend
  const login = async (email: string, password: string) => {
    const response = await API.post("/auth/login", { email, password });
    const { token, user: userData } = response.data;

    localStorage.setItem("fc_token", token);
    localStorage.setItem("fc_user", JSON.stringify(userData));
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
  };

  // Added register function to add data to MongoDB
  const register = async (name: string, email: string, password: string, role: Role) => {
    const response = await API.post("/auth/register", { name, email, password, role });
    const { token, user: userData } = response.data;

    localStorage.setItem("fc_token", token);
    localStorage.setItem("fc_user", JSON.stringify(userData));
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("fc_user");
    localStorage.removeItem("fc_token");
    delete API.defaults.headers.common["Authorization"];
  };

  return (
    <Ctx.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
};