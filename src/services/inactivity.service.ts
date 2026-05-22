import http, { normalise } from "@/lib/axios";

export const InactivityService = {
  checkIn: async (): Promise<{ message: string; coolingOffUntil: string | null }> => {
    try {
      return (await http.post<{ message: string; coolingOffUntil: string | null }>("/inactivity/check-in")).data;
    } catch (err) {
      normalise(err);
    }
  },
};
