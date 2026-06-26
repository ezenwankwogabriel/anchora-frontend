import http, { normalise } from '@/lib/axios';
import type { EstatesResponse } from '@/lib/types/estates';

export const EstatesService = {
  getEstates: async (): Promise<EstatesResponse> => {
    try {
      return (await http.get<EstatesResponse>('/estates')).data;
    } catch (err) {
      normalise(err);
    }
  },

  getReport: async (
    releaseId: string,
  ): Promise<{ url: string; expiresAt: string }> => {
    try {
      return (
        await http.get<{ url: string; expiresAt: string }>(
          `/estates/report/${releaseId}`,
        )
      ).data;
    } catch (err) {
      normalise(err);
    }
  },

  exitEstate: async (estateId: string): Promise<{ message: string }> => {
    try {
      return (
        await http.post<{ message: string }>(`/estates/${estateId}/exit`)
      ).data;
    } catch (err) {
      normalise(err);
    }
  },
};
