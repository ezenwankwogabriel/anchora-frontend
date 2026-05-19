import { create } from "zustand";
import type { AdminUser } from "@/lib/admin-types";

interface AdminAuthStore {
  admin: AdminUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (admin: AdminUser, token: string) => void;
  clearAuth: () => void;
}

export const useAdminAuthStore = create<AdminAuthStore>((set) => ({
  admin: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (admin, accessToken) =>
    set({ admin, accessToken, isAuthenticated: true }),
  clearAuth: () =>
    set({ admin: null, accessToken: null, isAuthenticated: false }),
}));
