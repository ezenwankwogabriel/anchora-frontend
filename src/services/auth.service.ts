import http, { normalise } from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";
import type { AssetCategory, AuthResponse, MfaLoginResponse, MfaSetupResponse, User } from "@/lib/types";

export const AuthService = {
  register: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    try {
      return (await http.post<AuthResponse>("/auth/register", data)).data;
    } catch (err) {
      normalise(err);
    }
  },

  login: async (data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    try {
      return (await http.post<AuthResponse>("/auth/login", data)).data;
    } catch (err) {
      normalise(err);
    }
  },

  verifyMfa: async (data: {
    code: string;
    tempToken: string;
  }): Promise<MfaLoginResponse> => {
    try {
      return (
        await http.post<MfaLoginResponse>("/auth/login/mfa", { code: data.code }, {
          headers: { Authorization: `Bearer ${data.tempToken}` },
        })
      ).data;
    } catch (err) {
      normalise(err);
    }
  },

  setupMfa: async (): Promise<MfaSetupResponse> => {
    try {
      return (await http.post<MfaSetupResponse>("/auth/mfa/setup")).data;
    } catch (err) {
      normalise(err);
    }
  },

  resendVerification: async (email: string): Promise<void> => {
    try {
      await http.post("/auth/resend-verification", { email });
    } catch (err) {
      normalise(err);
    }
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    try {
      return (await http.get<{ message: string }>(`/auth/verify-email?token=${token}`)).data;
    } catch (err) {
      normalise(err);
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    try {
      await http.post("/auth/forgot-password", { email });
    } catch (err) {
      normalise(err);
    }
  },

  resetPassword: async (data: {
    token: string;
    newPassword: string;
  }): Promise<void> => {
    try {
      await http.post("/auth/reset-password", data);
    } catch (err) {
      normalise(err);
    }
  },

  getMe: async (token?: string): Promise<User> => {
    try {
      return (await http.get<User>("/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })).data;
    } catch (err) {
      normalise(err);
    }
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    mfaCode?: string;
  }): Promise<void> => {
    try {
      await http.patch("/auth/me/password", data);
    } catch (err) {
      normalise(err);
    }
  },

  enableMfa: async (code: string): Promise<void> => {
    try {
      await http.post("/auth/mfa/verify", { code });
    } catch (err) {
      normalise(err);
    }
  },

  disableMfa: async (): Promise<void> => {
    try {
      await http.delete("/auth/mfa");
    } catch (err) {
      normalise(err);
    }
  },

  deleteAccount: async (): Promise<void> => {
    try {
      await http.delete("/auth/account");
    } catch (err) {
      normalise(err);
    }
  },

  updateMe: async (data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    reminderFrequencyDays?: number;
    inactivityWindowMonths?: number;
  }): Promise<User> => {
    try {
      return (await http.patch<User>("/auth/me", data)).data;
    } catch (err) {
      normalise(err);
    }
  },
  completeOnboarding: async (categories?: AssetCategory[]): Promise<void> => {
    try {
      await http.post("/auth/me/complete-onboarding", { categories });
    } catch (err) {
      normalise(err);
    }
  },

  logout: async (): Promise<void> => {
    try { await http.post('/auth/logout'); } catch { /* best-effort */ }
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
  },
};
