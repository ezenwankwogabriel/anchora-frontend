import http, { normalise } from "@/lib/axios";
import type { VaultRecord, VaultRecordInput } from "@/lib/types";

export interface VaultCompleteness {
  overallComplete: boolean;
  percentComplete: number;
  categories: {
    [category: string]: { hasRecord: boolean; count: number };
  };
}

function toApiPayload(input: VaultRecordInput) {
  return {
    category:            input.category,
    institutionName:     input.institutionName,
    accountName:         input.accountName      || undefined,
    accountType:         input.accountType      || undefined,
    accountNumber:       input.accountNumber    || undefined,
    usernameOrEmail:     input.usernameOrEmail  || undefined,
    accountUrl:          input.accountUrl       || undefined,
    notes:               input.notes            || undefined,
    executorIntent:      input.executorIntent   ?? "UNSPECIFIED",
    intendedBeneficiary: input.intendedBeneficiary || undefined,
    isSelfCustodied:     input.isSelfCustodied  ?? false,
  };
}

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

  createRecord: async (data: VaultRecordInput): Promise<VaultRecord> => {
    try {
      return (await http.post<VaultRecord>("/vault/records", toApiPayload(data))).data;
    } catch (err) {
      normalise(err);
    }
  },

  updateRecord: async (id: string, data: VaultRecordInput): Promise<VaultRecord> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { category, ...payload } = toApiPayload(data) as Record<string, unknown>;
    try {
      return (await http.patch<VaultRecord>(`/vault/records/${id}`, payload)).data;
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

  getCompleteness: async (): Promise<VaultCompleteness> => {
    try {
      return (await http.get<VaultCompleteness>("/vault/completeness")).data;
    } catch (err) {
      normalise(err);
    }
  },
};
