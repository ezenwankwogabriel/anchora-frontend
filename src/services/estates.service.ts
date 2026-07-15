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

  // Calls the report-access endpoint directly rather than a per-feature
  // wrapper — it's the same gate (executor acceptance, identity
  // verification, 30-day access window) regardless of who's asking.
  getReport: async (
    releaseId: string,
  ): Promise<{ url: string; expiresAt: string }> => {
    try {
      const { reportUrl, accessExpiresAt } = (
        await http.get<{ reportUrl: string; ownerFirstName: string; accessExpiresAt: string }>(
          `/release/report/${releaseId}`,
        )
      ).data;
      return { url: reportUrl, expiresAt: accessExpiresAt };
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

  acceptInvite: async (estateId: string): Promise<{ message: string }> => {
    try {
      return (
        await http.post<{ message: string }>(`/estates/${estateId}/accept`)
      ).data;
    } catch (err) {
      normalise(err);
    }
  },

  declineInvite: async (estateId: string): Promise<{ message: string }> => {
    try {
      return (
        await http.post<{ message: string }>(`/estates/${estateId}/decline`)
      ).data;
    } catch (err) {
      normalise(err);
    }
  },
};
