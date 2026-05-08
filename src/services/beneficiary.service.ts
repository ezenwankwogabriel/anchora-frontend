import http, { normalise } from "@/lib/axios";
import type { Beneficiary, BeneficiaryDetail, BeneficiaryInput } from "@/lib/types";

export const BeneficiaryService = {
  getAll: async (): Promise<Beneficiary[]> => {
    try {
      return (await http.get<Beneficiary[]>("/beneficiaries")).data;
    } catch (err) {
      normalise(err);
    }
  },

  get: async (id: string): Promise<BeneficiaryDetail> => {
    try {
      return (await http.get<BeneficiaryDetail>(`/beneficiaries/${id}`)).data;
    } catch (err) {
      normalise(err);
    }
  },

  create: async (data: BeneficiaryInput): Promise<Beneficiary> => {
    try {
      return (await http.post<Beneficiary>("/beneficiaries", data)).data;
    } catch (err) {
      normalise(err);
    }
  },

  update: async (id: string, data: Partial<BeneficiaryInput>): Promise<Beneficiary> => {
    try {
      return (await http.patch<Beneficiary>(`/beneficiaries/${id}`, data)).data;
    } catch (err) {
      normalise(err);
    }
  },

  setDefault: async (id: string): Promise<Beneficiary> => {
    try {
      return (await http.patch<Beneficiary>(`/beneficiaries/${id}/set-default`)).data;
    } catch (err) {
      normalise(err);
    }
  },

  remove: async (id: string): Promise<void> => {
    try {
      await http.delete(`/beneficiaries/${id}`);
    } catch (err) {
      normalise(err);
    }
  },
};
