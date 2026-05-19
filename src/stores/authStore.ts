import { create } from "zustand";
import type { User } from "@/lib/types";

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

const user = {
  id: "xxx-xxx",
  firstName: "Gabriel",
  lastName: "Ezenwankwo",
  email: "dagabangel@gmail.com",
  emailVerified: true,
  mfaEnabled: false,
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

export const useAuthStore = create<AuthStore>((set) => ({
  user: user ?? null,
  accessToken: user.id ?? null,
  isAuthenticated: true, // false
  setAuth: (user, accessToken) => {
    setCookie("anchora_auth", 1);
    set({ user, accessToken, isAuthenticated: true });
  },
  clearAuth: () => {
    clearCookie("anchora_auth");
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
