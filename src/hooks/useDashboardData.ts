import { useEffect, useReducer } from "react";
import { VaultService } from "@/services/vault.service";
import { BeneficiaryService } from "@/services/beneficiary.service";
import type { VaultRecord, VaultCompleteness, Beneficiary } from "@/lib/types";

interface DashboardErrors {
  records: boolean;
  completeness: boolean;
  beneficiaries: boolean;
}

interface State {
  loading: boolean;
  records: VaultRecord[] | null;
  completeness: VaultCompleteness | null;
  beneficiaries: Beneficiary[] | null;
  errors: DashboardErrors;
}

type Action =
  | {
      type: "LOADED";
      records: VaultRecord[] | null;
      completeness: VaultCompleteness | null;
      beneficiaries: Beneficiary[] | null;
      errors: DashboardErrors;
    }
  | { type: "DELETE_RECORD"; id: string };

const initialState: State = {
  loading: true,
  records: null,
  completeness: null,
  beneficiaries: null,
  errors: { records: false, completeness: false, beneficiaries: false },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOADED":
      return {
        loading: false,
        records: action.records,
        completeness: action.completeness,
        beneficiaries: action.beneficiaries,
        errors: action.errors,
      };
    case "DELETE_RECORD":
      return {
        ...state,
        records: state.records?.filter((r) => r.id !== action.id) ?? null,
      };
  }
}

export function useDashboardData() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function load() {
      const [recordsRes, completenessRes, beneficiariesRes] =
        await Promise.allSettled([
          VaultService.getRecords(),
          VaultService.getCompleteness(),
          BeneficiaryService.getAll(),
        ]);

      dispatch({
        type: "LOADED",
        records:       recordsRes.status === "fulfilled"      ? (recordsRes.value ?? [])       : null,
        completeness:  completenessRes.status === "fulfilled" ? (completenessRes.value ?? null) : null,
        beneficiaries: beneficiariesRes.status === "fulfilled"? (beneficiariesRes.value ?? [])  : null,
        errors: {
          records:       recordsRes.status === "rejected",
          completeness:  completenessRes.status === "rejected",
          beneficiaries: beneficiariesRes.status === "rejected",
        },
      });
    }

    load();
  }, []);

  const deleteRecord = (id: string) => {
    VaultService.deleteRecord(id).then(() =>
      dispatch({ type: "DELETE_RECORD", id })
    );
  };

  return { ...state, deleteRecord };
}
