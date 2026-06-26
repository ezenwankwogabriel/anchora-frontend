import http, { normalise } from "@/lib/axios";
import type { PlanData } from "@/lib/types";

export const PlanService = {
  get: async (): Promise<PlanData> => {
    try {
      return (await http.get<PlanData>("/auth/plan")).data;
    } catch (err) {
      normalise(err);
    }
  },
};
