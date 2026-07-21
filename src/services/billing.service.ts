import http, { normalise } from "@/lib/axios";
import type { BillingData } from "@/lib/types";

interface CheckoutResponse {
  accessCode: string;
  reference: string;
}

export const BillingService = {
  getPlan: async (): Promise<BillingData> => {
    try {
      return (await http.get<BillingData>("/billing/plan")).data;
    } catch (err) {
      normalise(err);
    }
  },

  checkout: async (): Promise<CheckoutResponse> => {
    try {
      return (await http.post<CheckoutResponse>("/billing/checkout")).data;
    } catch (err) {
      normalise(err);
    }
  },

  renew: async (): Promise<CheckoutResponse> => {
    try {
      return (await http.post<CheckoutResponse>("/billing/renew")).data;
    } catch (err) {
      normalise(err);
    }
  },

  devActivate: async (plan: "FREE" | "PRO"): Promise<void> => {
    try {
      await http.post("/billing/dev/activate", { plan });
    } catch (err) {
      normalise(err);
    }
  },
};
