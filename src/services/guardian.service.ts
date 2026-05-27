import http, { normalise } from "@/lib/axios";
import type { Guardian, GuardianInput } from "@/lib/types";

export const GuardianService = {
  get: async (): Promise<Guardian | null> => {
    try {
      return (await http.get<Guardian | null>("/guardian")).data;
    } catch (err) {
      normalise(err);
    }
  },

  upsert: async (data: GuardianInput): Promise<Guardian> => {
    try {
      return (await http.patch<Guardian>("/guardian", data)).data;
    } catch (err) {
      normalise(err);
    }
  },

  remove: async (): Promise<void> => {
    try {
      await http.delete("/guardian");
    } catch (err) {
      normalise(err);
    }
  },
};
