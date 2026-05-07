import http, { normalise } from "@/lib/axios";
import type { AuthResponse, MfaSetupResponse } from "@/lib/types";

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
    code?: string;
    recoveryCode?: string;
    session?: string;
  }): Promise<AuthResponse> => {
    try {
      return (await http.post<AuthResponse>("/auth/mfa/verify", data)).data;
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
};
