import http, { normalise } from "@/lib/axios";
import type { ReleaseReport } from "@/lib/types";

export const ReleaseService = {
  getReport: async (releaseId: string): Promise<ReleaseReport> => {
    try {
      return (await http.get<ReleaseReport>(`/release/report/${releaseId}`)).data;
    } catch (err) {
      normalise(err);
    }
  },

  submitVerification: async (releaseId: string, data: FormData): Promise<void> => {
    try {
      await http.post(`/release/verify/${releaseId}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      normalise(err);
    }
  },
};
