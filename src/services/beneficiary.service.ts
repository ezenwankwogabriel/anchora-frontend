import http, { normalise } from "@/lib/axios";
import type { Beneficiary } from "@/lib/types";

export const BeneficiaryService = {
  getAll: async (): Promise<Beneficiary[]> => {
    try {
      return (await http.get<Beneficiary[]>("/beneficiaries")).data;
    } catch (err) {
      normalise(err);
    }
  },
};
