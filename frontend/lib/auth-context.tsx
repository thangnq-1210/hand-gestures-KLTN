"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "caregiver" | "admin";
  preferredLanguage: "vi" | "en";
  disabilityLevel?: "none" | "light" | "moderate" | "severe";
  managedUserIds?: string[];
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role?: "user" | "caregiver"
  ) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  addManagedUser?: (userId: string) => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user + token từ localStorage khi reload trang
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedUser = window.localStorage.getItem("user");
    const storedToken = window.localStorage.getItem("access_token");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (
          parsed.createdAt &&
          (typeof parsed.createdAt === "string" ||
            typeof parsed.createdAt === "number")
        ) {
          parsed.createdAt = new Date(parsed.createdAt);
        }
        setUser(parsed);
      } catch {
        window.localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  // Gọi API /auth/login
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Đăng nhập thất bại");
      }

      const data: {
        access_token: string;
        token_type: string;
        user: { id: number; email: string; name: string; role: string };
      } = await res.json();

      const mappedUser: User = {
        id: String(data.user.id),
        email: data.user.email,
        name: data.user.name,
        role: (data.user.role as any) || "user",
        preferredLanguage: "vi", // backend chưa trả, default tạm
        createdAt: new Date(),
      };

      setUser(mappedUser);
      setToken(data.access_token);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("user", JSON.stringify(mappedUser));
        window.localStorage.setItem("access_token", data.access_token);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Gọi API /auth/register, xong tự login lại
  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      role: "user" | "caregiver" = "user"
    ) => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, name, role }),
        });

        if (!res.ok) {
          let message = "Đăng ký thất bại";

          const text = await res.text();
          try {
            const data = JSON.parse(text);
            if (data && typeof data.detail === "string") {
              message = data.detail; // "Email đã được sử dụng"
            } else if (typeof data === "string") {
              message = data;
            }
          } catch {
            if (text) message = text;
          }

          throw new Error(message);
        }

        // Backend trả UserOut, xong tự login
        await login(email, password);
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );


  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("access_token");
    }
  }, []);

  // Các hàm này tạm mock, sau có API thì nối tiếp
  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      if (!user) return;
      const updated = { ...user, ...data };
      setUser(updated);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("user", JSON.stringify(updated));
      }
    },
    [user]
  );

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      console.log("changePassword (mock)", { oldPassword, newPassword });
      // sau có API /auth/change-password thì gọi tại đây
    },
    []
  );

  const forgotPassword = useCallback(async (email: string) => {
    console.log("forgotPassword (mock)", { email });
    // sau có API reset password thì gọi tại đây
  }, []);

  const addManagedUser = useCallback(
    (userId: string) => {
      if (!user || user.role !== "caregiver") return;
      const updated: User = {
        ...user,
        managedUserIds: [...(user.managedUserIds || []), userId],
      };
      setUser(updated);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("user", JSON.stringify(updated));
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        forgotPassword,
        addManagedUser,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
