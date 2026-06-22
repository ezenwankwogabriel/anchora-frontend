import http, { normalise } from "@/lib/axios";
import type { VaultRecord, VaultRecordInput } from "@/lib/types";

// Maps frontend form fields to backend API field names.
// institutionName → accountName (primary identifier shown in lists).
// accountType, nickname map directly to their backend counterparts.
// For OTHER: nickname (asset label) is the primary identifier; institutionName is secondary.
function toApiPayload(input: VaultRecordInput) {
  const shared = {
    accountType:         input.accountType         || null,
    nickname:            input.nickname            || null,
    holderName:          input.holderName          || undefined,
    accountNumber:       input.accountNumber       || undefined,
    usernameOrEmail:     input.usernameOrEmail     || undefined,
    password:            input.password            || undefined,
    cardPin:             input.cardPin             || undefined,
    notes:               input.notes               || undefined,
    executorIntent:      input.executorIntent      ?? "UNSPECIFIED",
    intendedBeneficiary: input.intendedBeneficiary || undefined,
    isSelfCustodied:     input.isSelfCustodied     ?? false,
    recoveryNotes:       input.recoveryNotes       || undefined,
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

};
