import http, { normalise } from "@/lib/axios";
import type { IdentityStatus } from "@/lib/types";

export const IdentityService = {
  // selfieImage: base64 JPEG without the data:image/...;base64, prefix.
  verifyNin: async (nin: string, selfieImage: string): Promise<IdentityStatus> => {
    try {
      return (
        await http.post<IdentityStatus>("/identity/verify-nin", { nin, selfieImage })
      ).data;
    } catch (err) {
      normalise(err);
    }
  },

  status: async (): Promise<IdentityStatus> => {
    try {
      return (await http.get<IdentityStatus>("/identity/status")).data;
    } catch (err) {
      normalise(err);
    }
  },
};
