import http, { normalise } from "@/lib/axios";

export const InactivityService = {
  checkIn: async (): Promise<{ message: string }> => {
    try {
      return (await http.post<{ message: string }>("/inactivity/check-in")).data;
    } catch (err) {
      normalise(err);
    }
  },
};
