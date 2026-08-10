import { useCallback, useEffect, useRef, useReducer } from "react";
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
  | {
      type: "LOADED";
      records: VaultRecord[] | null;
      executor: Executor | null;
      error: boolean;
    }
  | { type: "DELETE_RECORD"; id: string }
  | { type: "UPDATE_RECORD_VALUES"; updates: Record<string, number | null> };

const initialState: State = {
  loading: true,
  records: null,
  executor: null,
  error: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOADED":
      return {
        loading: false,
        records: action.records,
        executor: action.executor,
        error: action.error,
      };
    case "DELETE_RECORD":
      return {
        ...state,
        records: state.records?.filter((r) => r.id !== action.id) ?? null,
      };
    case "UPDATE_RECORD_VALUES":
      return {
        ...state,
        records:
          state.records?.map((r) =>
            r.id in action.updates ? { ...r, estimatedValue: action.updates[r.id] } : r,
          ) ?? null,
      };
  }
}

export function useDashboardData() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const staleRef = useRef(false);

  const load = useCallback(async () => {
    const [recordsRes, executorRes] = await Promise.allSettled([
      VaultService.getRecords(),
      ExecutorService.get(),
    ]);

    if (staleRef.current) {
      // If this ever logs, the fetch outlived its component (e.g. an
      // unmount/remount raced the 401-refresh-retry cycle) and the
      // resolved data was intentionally dropped instead of silently
      // vanishing into a state update React discards.
      return;
    }

    dispatch({
      type: "LOADED",
      records:
        recordsRes.status === "fulfilled" ? (recordsRes.value ?? []) : null,
      executor:
        executorRes.status === "fulfilled" ? (executorRes.value ?? null) : null,
      error: recordsRes.status === "rejected",
    });
  }, []);

  useEffect(() => {
    staleRef.current = false;
    load();
    return () => {
      staleRef.current = true;
    };
  }, [load]);

  const deleteRecord = (id: string) => {
    VaultService.deleteRecord(id).then(() =>
      dispatch({ type: "DELETE_RECORD", id }),
    );
  };

  const updateRecordValues = (updates: Record<string, number | null>) => {
    dispatch({ type: "UPDATE_RECORD_VALUES", updates });
  };

  return { ...state, deleteRecord, updateRecordValues, refetch: load };
}
