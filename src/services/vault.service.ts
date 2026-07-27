import http, { normalise } from "@/lib/axios";
import type { VaultDocument, VaultRecord, VaultRecordInput } from "@/lib/types";

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
    accountName:         input.accountName         || undefined,
    accountUrl:          input.accountUrl          || undefined,
    credential:          input.credential          || undefined,
    referenceId:         input.referenceId         || undefined,
    notes:               input.notes               || undefined,
    executorIntent:      input.executorIntent      ?? "UNSPECIFIED",
    intendedBeneficiary: input.intendedBeneficiary || undefined,
    isSelfCustodied:     input.isSelfCustodied     ?? false,
    accountType:         input.accountType         || undefined,
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

  getDocuments: async (recordId: string): Promise<VaultDocument[]> => {
    try {
      return (await http.get<VaultDocument[]>(`/vault/records/${recordId}/documents`)).data;
    } catch (err) {
      normalise(err);
    }
  },

  uploadDocument: async (
    recordId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<VaultDocument> => {
    const formData = new FormData();
    formData.append("document", file);
    try {
      return (
        await http.post<VaultDocument>(`/vault/records/${recordId}/documents`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event) => {
            if (onProgress && event.total) {
              onProgress(Math.round((event.loaded / event.total) * 100));
            }
          },
        })
      ).data;
    } catch (err) {
      normalise(err);
    }
  },

  deleteDocument: async (recordId: string, documentId: string): Promise<void> => {
    try {
      await http.delete(`/vault/records/${recordId}/documents/${documentId}`);
    } catch (err) {
      normalise(err);
    }
  },

  getDocumentUrl: async (
    recordId: string,
    documentId: string,
  ): Promise<{ url: string; filename: string }> => {
    try {
      return (
        await http.get<{ url: string; filename: string }>(
          `/vault/records/${recordId}/documents/${documentId}/url`,
        )
      ).data;
    } catch (err) {
      normalise(err);
    }
  },
};
