import { useEffect, useReducer } from "react";
import { VaultService } from "@/services/vault.service";
import { BeneficiaryService } from "@/services/beneficiary.service";
import type { VaultRecord, Beneficiary } from "@/lib/types";

interface DashboardErrors {
  records: boolean;
  beneficiaries: boolean;
}

interface State {
  loading: boolean;
  records: VaultRecord[] | null;
  beneficiaries: Beneficiary[] | null;
  errors: DashboardErrors;
}

type Action =
  | {
      type: "LOADED";
      records: VaultRecord[] | null;
      beneficiaries: Beneficiary[] | null;
      errors: DashboardErrors;
    }
  | { type: "DELETE_RECORD"; id: string };

const initialState: State = {
  loading: true,
  records: null,
  beneficiaries: null,
  errors: { records: false, beneficiaries: false },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOADED":
      return {
        loading: false,
        records: action.records,
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
      const [recordsRes, beneficiariesRes] =
        await Promise.allSettled([
          VaultService.getRecords(),
          BeneficiaryService.getAll(),
        ]);

      dispatch({
        type: "LOADED",
        records:       recordsRes.status === "fulfilled"       ? (recordsRes.value ?? [])      : null,
        beneficiaries: beneficiariesRes.status === "fulfilled" ? (beneficiariesRes.value ?? []) : null,
        errors: {
          records:       recordsRes.status === "rejected",
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
