import { create } from "zustand";
import type { AdminUser } from "@/lib/admin-types";

const LS_TOKEN = "anchora_admin_token";
const LS_ADMIN = "anchora_admin_user";

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

function loadFromStorage(): { admin: AdminUser | null; accessToken: string | null } {
  if (typeof window === "undefined") return { admin: null, accessToken: null };
  try {
    const accessToken = localStorage.getItem(LS_TOKEN);
    const raw = localStorage.getItem(LS_ADMIN);
    const admin = raw ? (JSON.parse(raw) as AdminUser) : null;
    return { admin, accessToken };
  } catch {
    return { admin: null, accessToken: null };
  }
}

const { admin: storedAdmin, accessToken: storedToken } = loadFromStorage();

export const useAdminAuthStore = create<AdminAuthStore>((set) => ({
  admin: storedAdmin,
  accessToken: storedToken,
  isAuthenticated: !!(storedAdmin && storedToken),
  setAuth: (admin, accessToken) => {
    localStorage.setItem(LS_TOKEN, accessToken);
    localStorage.setItem(LS_ADMIN, JSON.stringify(admin));
    setCookie("anchora_admin_auth", 1);
    set({ admin, accessToken, isAuthenticated: true });
  },
  clearAuth: () => {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_ADMIN);
    clearCookie("anchora_admin_auth");
    set({ admin: null, accessToken: null, isAuthenticated: false });
  },
}));
