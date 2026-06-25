import http, { normalise } from "@/lib/axios";
import type { Executor, ExecutorInput } from "@/lib/types";

export const ExecutorService = {
  get: async (): Promise<Executor | null> => {
    try {
      return (await http.get<Executor | null>("/executor")).data;
    } catch (err) {
      normalise(err);
    }
  },

  create: async (data: ExecutorInput): Promise<Executor> => {
    try {
      return (await http.post<Executor>("/executor", data)).data;
    } catch (err) {
      normalise(err);
    }
  },

  update: async (data: Partial<ExecutorInput>): Promise<Executor> => {
    try {
      return (await http.patch<Executor>("/executor", data)).data;
    } catch (err) {
      normalise(err);
    }
  },

  remove: async (): Promise<void> => {
    try {
      await http.delete("/executor");
    } catch (err) {
      normalise(err);
    }
  },

  resendInvite: async (): Promise<void> => {
    try {
      await http.post("/executor/resend-invite");
    } catch (err) {
      normalise(err);
    }
  },

  accept: async (token: string): Promise<{ status: "LINKED" | "LOGIN_REQUIRED" | "SIGNUP_REQUIRED"; redirectUrl?: string }> => {
    try {
      return (await http.post<{ status: "LINKED" | "LOGIN_REQUIRED" | "SIGNUP_REQUIRED"; redirectUrl?: string }>(
        `/executor/accept?token=${encodeURIComponent(token)}`
      )).data;
    } catch (err) {
      normalise(err);
    }
  },

  decline: async (token: string): Promise<void> => {
    try {
      await http.post(`/executor/decline?token=${encodeURIComponent(token)}`);
    } catch (err) {
      normalise(err);
    }
  },
};
