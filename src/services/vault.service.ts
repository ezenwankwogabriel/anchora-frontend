import http, { normalise } from "@/lib/axios";
import type { VaultRecord, VaultRecordInput, VaultCompleteness } from "@/lib/types";

export const VaultService = {
  getRecords: async (): Promise<VaultRecord[]> => {
    try {
      return (await http.get<VaultRecord[]>("/vault/records")).data;
    } catch (err) {
      normalise(err);
    }
  },

  getRecord: async (id: string): Promise<VaultRecord> => {
    try {
      return (await http.get<VaultRecord>(`/vault/records/${id}`)).data;
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

  createRecord: async (data: VaultRecordInput): Promise<VaultRecord> => {
    try {
      return (await http.post<VaultRecord>("/vault/records", data)).data;
    } catch (err) {
      normalise(err);
    }
  },

  updateRecord: async (id: string, data: Partial<VaultRecordInput>): Promise<VaultRecord> => {
    try {
      return (await http.patch<VaultRecord>(`/vault/records/${id}`, data)).data;
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
