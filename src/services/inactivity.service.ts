import http, { normalise } from "@/lib/axios";
import type { InactivityStatus } from "@/lib/types";

export const InactivityService = {
  getStatus: async (): Promise<InactivityStatus> => {
    try {
      return (await http.get<InactivityStatus>("/inactivity/status")).data;
    } catch (err) {
      normalise(err);
    }
  },
};
