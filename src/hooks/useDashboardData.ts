import { useEffect, useReducer } from "react";
import { VaultService } from "@/services/vault.service";
import { ExecutorService } from "@/services/executor.service";
import type { VaultRecord, Executor } from "@/lib/types";

interface State {
  loading: boolean;
  records: VaultRecord[] | null;
  executor: Executor | null;
  error: boolean;
}

type Action =
  | { type: "LOADED"; records: VaultRecord[] | null; executor: Executor | null; error: boolean }
  | { type: "DELETE_RECORD"; id: string };

const initialState: State = {
  loading: true,
  records: null,
  executor: null,
  error: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOADED":
      return { loading: false, records: action.records, executor: action.executor, error: action.error };
    case "DELETE_RECORD":
      return { ...state, records: state.records?.filter((r) => r.id !== action.id) ?? null };
  }
}

export function useDashboardData() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function load() {
      const [recordsRes, executorRes] = await Promise.allSettled([
        VaultService.getRecords(),
        ExecutorService.get(),
      ]);

      dispatch({
        type: "LOADED",
        records:  recordsRes.status === "fulfilled"  ? (recordsRes.value ?? [])      : null,
        executor: executorRes.status === "fulfilled" ? (executorRes.value ?? null)   : null,
        error:    recordsRes.status === "rejected",
      });
    }
    load();
  }, []);

  const deleteRecord = (id: string) => {
    VaultService.deleteRecord(id).then(() => dispatch({ type: "DELETE_RECORD", id }));
  };

  return { ...state, deleteRecord };
}
