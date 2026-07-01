import http, { normalise } from "@/lib/axios";
import type { BillingCycle, PlanData } from "@/lib/types";

interface InitializeResponse {
  accessCode: string;
  reference: string;
}

export const SubscriptionService = {
  initialize: async (billingCycle: BillingCycle): Promise<InitializeResponse> => {
    try {
      return (await http.post<InitializeResponse>("/subscription/initialize", { billingCycle })).data;
    } catch (err) {
      normalise(err);
    }
  },

  status: async (): Promise<PlanData> => {
    try {
      return (await http.get<PlanData>("/subscription/status")).data;
    } catch (err) {
      normalise(err);
    }
  },

  cancel: async (): Promise<void> => {
    try {
      await http.post("/subscription/cancel");
    } catch (err) {
      normalise(err);
    }
  },

  resume: async (): Promise<void> => {
    try {
      await http.post("/subscription/resume");
    } catch (err) {
      normalise(err);
    }
  },

  changeCycle: async (billingCycle: BillingCycle): Promise<InitializeResponse> => {
    try {
      return (await http.post<InitializeResponse>("/subscription/change-cycle", { billingCycle })).data;
    } catch (err) {
      normalise(err);
    }
  },

  devActivate: async (plan: "FREE" | "PRO", billingCycle?: BillingCycle): Promise<void> => {
    try {
      await http.post("/subscription/dev/activate", { plan, billingCycle });
    } catch (err) {
      normalise(err);
    }
  },
};
