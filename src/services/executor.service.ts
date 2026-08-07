import http, { normalise } from "@/lib/axios";
import type { Executor, ExecutorInput } from "@/lib/types";

export const ExecutorService = {
  list: async (): Promise<Executor[]> => {
    try {
      return (await http.get<Executor[]>("/executor")).data;
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

  update: async (id: string, data: Partial<ExecutorInput>): Promise<Executor> => {
    try {
      return (await http.patch<Executor>(`/executor/${id}`, data)).data;
    } catch (err) {
      normalise(err);
    }
  },

  remove: async (id: string): Promise<void> => {
    try {
      await http.delete(`/executor/${id}`);
    } catch (err) {
      normalise(err);
    }
  },

  notify: async (id: string): Promise<void> => {
    try {
      await http.post(`/executor/${id}/notify`);
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
