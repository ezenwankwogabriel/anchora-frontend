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
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: user ?? null,
  accessToken: user.id ?? null,
  isAuthenticated: true, // false
  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),
  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),
}));
