import { create } from "zustand";
import type { AdminUser } from "@/lib/admin-types";

interface AdminAuthStore {
  admin: AdminUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (admin: AdminUser, token: string) => void;
  clearAuth: () => void;
}

function setCookie(name: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=1; path=/; expires=${expires}; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export const useAdminAuthStore = create<AdminAuthStore>((set) => ({
  admin: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (admin, accessToken) => {
    setCookie("anchora_admin_auth", 1);
    set({ admin, accessToken, isAuthenticated: true });
  },
  clearAuth: () => {
    clearCookie("anchora_admin_auth");
    set({ admin: null, accessToken: null, isAuthenticated: false });
  },
}));
