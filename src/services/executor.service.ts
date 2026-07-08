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

  notify: async (): Promise<void> => {
    try {
      await http.post("/executor/notify");
    } catch (err) {
      normalise(err);
    }
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    try {
      return (await http.post<{ message: string }>(
        `/executor/verify-email?token=${encodeURIComponent(token)}`
      )).data;
    } catch (err) {
      normalise(err);
    }
  },
};
