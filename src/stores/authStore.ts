import { create } from "zustand";
import type { User } from "@/lib/types";

const LS_TOKEN   = "anchora_token";
const LS_REFRESH = "anchora_refresh_token";
const LS_SESSION = "anchora_session_id";
const LS_USER    = "anchora_user";

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string, sessionId: string) => void;
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

function loadFromStorage() {
  if (typeof window === "undefined")
    return { user: null, accessToken: null, refreshToken: null, sessionId: null };
  try {
    const accessToken  = localStorage.getItem(LS_TOKEN);
    const refreshToken = localStorage.getItem(LS_REFRESH);
    const sessionId    = localStorage.getItem(LS_SESSION);
    const raw  = localStorage.getItem(LS_USER);
    const user = raw ? (JSON.parse(raw) as User) : null;
    return { user, accessToken, refreshToken, sessionId };
  } catch {
    return { user: null, accessToken: null, refreshToken: null, sessionId: null };
  }
}

const stored = loadFromStorage();

export const useAuthStore = create<AuthStore>((set) => ({
  user:            stored.user,
  accessToken:     stored.accessToken,
  refreshToken:    stored.refreshToken,
  sessionId:       stored.sessionId,
  isAuthenticated: !!(stored.user && stored.accessToken),
  setAuth: (user, accessToken, refreshToken, sessionId) => {
    localStorage.setItem(LS_TOKEN,   accessToken);
    localStorage.setItem(LS_REFRESH, refreshToken);
    localStorage.setItem(LS_SESSION, sessionId);
    localStorage.setItem(LS_USER,    JSON.stringify(user));
    setCookie("anchora_auth", 1);
    set({ user, accessToken, refreshToken, sessionId, isAuthenticated: true });
  },
  clearAuth: () => {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_REFRESH);
    localStorage.removeItem(LS_SESSION);
    localStorage.removeItem(LS_USER);
    clearCookie("anchora_auth");
    set({ user: null, accessToken: null, refreshToken: null, sessionId: null, isAuthenticated: false });
  },
}));
