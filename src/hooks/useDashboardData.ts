import { useEffect, useReducer } from "react";
import { VaultService } from "@/services/vault.service";
import { BeneficiaryService } from "@/services/beneficiary.service";
import { ExecutorService } from "@/services/executor.service";
import type { VaultRecord, Beneficiary, Executor } from "@/lib/types";

interface DashboardErrors {
  records: boolean;
  beneficiaries: boolean;
}

interface State {
  loading: boolean;
  records: VaultRecord[] | null;
  beneficiaries: Beneficiary[] | null;
  executor: Executor | null;
  errors: DashboardErrors;
}

type Action =
  | {
      type: "LOADED";
      records: VaultRecord[] | null;
      beneficiaries: Beneficiary[] | null;
      executor: Executor | null;
      errors: DashboardErrors;
    }
  | { type: "DELETE_RECORD"; id: string };

const initialState: State = {
  loading: true,
  records: null,
  beneficiaries: null,
  executor: null,
  errors: { records: false, beneficiaries: false },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOADED":
      return {
        loading: false,
        records: action.records,
        beneficiaries: action.beneficiaries,
        executor: action.executor,
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
      const [recordsRes, beneficiariesRes, executorRes] =
        await Promise.allSettled([
          VaultService.getRecords(),
          BeneficiaryService.getAll(),
          ExecutorService.get(),
        ]);

      dispatch({
        type: "LOADED",
        records:       recordsRes.status === "fulfilled"       ? (recordsRes.value ?? [])      : null,
        beneficiaries: beneficiariesRes.status === "fulfilled" ? (beneficiariesRes.value ?? []) : null,
        executor:      executorRes.status === "fulfilled"      ? (executorRes.value ?? null)    : null,
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
