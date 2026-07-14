import http, { normalise } from "@/lib/axios";
import type { IdentityStatus } from "@/lib/types";

interface CreateSessionResponse {
  sessionToken: string;
}

export const IdentityService = {
  createSession: async (): Promise<CreateSessionResponse> => {
    try {
      return (await http.post<CreateSessionResponse>("/identity/session")).data;
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
