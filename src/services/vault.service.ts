import http, { normalise } from "@/lib/axios";
import type { VaultRecord, VaultCompleteness } from "@/lib/types";

export const VaultService = {
  getRecords: async (): Promise<VaultRecord[]> => {
    try {
      return (await http.get<VaultRecord[]>("/vault/records")).data;
    } catch (err) {
      normalise(err);
    }
  },

  getCompleteness: async (): Promise<VaultCompleteness> => {
    try {
      return (await http.get<VaultCompleteness>("/vault/completeness")).data;
    } catch (err) {
      normalise(err);
    }
  },

  deleteRecord: async (id: string): Promise<void> => {
    try {
      await http.delete(`/vault/records/${id}`);
    } catch (err) {
      normalise(err);
    }
  },
};
