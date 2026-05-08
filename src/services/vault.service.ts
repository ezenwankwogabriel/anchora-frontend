import http, { normalise } from "@/lib/axios";
import type { VaultRecord, VaultRecordInput, VaultCompleteness, Beneficiary } from "@/lib/types";

// Maps frontend form fields to backend API field names.
// institutionName → accountName (primary identifier shown in lists).
// accountType, nickname map directly to their backend counterparts.
// For OTHER: nickname (asset label) is the primary identifier; institutionName is secondary.
function toApiPayload(input: VaultRecordInput) {
  const shared = {
    accountType:     input.accountType     || null,
    nickname:        input.nickname        || null,
    accountUrl:      input.accountUrl      || undefined,
    holderName:      input.holderName      || undefined,
    usernameOrEmail: input.usernameOrEmail || undefined,
    notes:           input.notes           || undefined,
    ...(input.beneficiaryId ? { beneficiaryId: input.beneficiaryId } : {}),
  };

  if (input.category === "OTHER") {
    return {
      ...shared,
      category:    input.category,
      accountName: input.nickname || input.institutionName,
      accountType: null,
      nickname:    input.institutionName || null,
    };
  }

  return {
    ...shared,
    category:    input.category,
    accountName: input.institutionName,
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

  getCompleteness: async (): Promise<VaultCompleteness> => {
    try {
      return (await http.get<VaultCompleteness>("/vault/completeness")).data;
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
    const { category, beneficiaryId, ...payload } = toApiPayload(data) as Record<string, unknown>;
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

  getRecordBeneficiaries: async (recordId: string): Promise<Beneficiary[]> => {
    try {
      return (await http.get<Beneficiary[]>(`/vault/records/${recordId}/beneficiaries`)).data;
    } catch (err) {
      normalise(err);
    }
  },

  assignBeneficiary: async (recordId: string, beneficiaryId: string): Promise<void> => {
    try {
      await http.post(`/vault/records/${recordId}/beneficiaries`, { beneficiaryId });
    } catch (err) {
      normalise(err);
    }
  },

  removeRecordBeneficiary: async (recordId: string, beneficiaryId: string): Promise<void> => {
    try {
      await http.delete(`/vault/records/${recordId}/beneficiaries/${beneficiaryId}`);
    } catch (err) {
      normalise(err);
    }
  },
};
