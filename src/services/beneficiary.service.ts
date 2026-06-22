import http, { normalise } from "@/lib/axios";
import type { SharedVaultItem } from "@/lib/types";

export const BeneficiaryService = {
  getSharedWithMe: async (): Promise<SharedVaultItem[]> => {
    try {
      return (await http.get<SharedVaultItem[]>("/beneficiaries/shared-with-me")).data;
    } catch (err) {
      normalise(err);
    }
  },
};
