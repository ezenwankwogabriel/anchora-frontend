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
  | {
      type: "LOADED";
      records: VaultRecord[] | null;
      executor: Executor | null;
      error: boolean;
    }
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
  }
}

export function useDashboardData() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let stale = false;

    async function load() {
      const [recordsRes, executorRes] = await Promise.allSettled([
        VaultService.getRecords(),
        // Dashboard nudge is still single-contact-shaped pending the
        // multi-contact nudge redesign — surface the first-ranked contact,
        // matching today's behavior when there was only ever one.
        ExecutorService.list().then((list) => list[0] ?? null),
      ]);

      if (stale) {
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
          executorRes.status === "fulfilled"
            ? (executorRes.value ?? null)
            : null,
        error: recordsRes.status === "rejected",
      });
    }
    load();

    return () => {
      stale = true;
    };
  }, []);

  const deleteRecord = (id: string) => {
    VaultService.deleteRecord(id).then(() =>
      dispatch({ type: "DELETE_RECORD", id }),
    );
  };

  return { ...state, deleteRecord };
}
