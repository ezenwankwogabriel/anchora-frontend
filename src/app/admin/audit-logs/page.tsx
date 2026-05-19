"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Download, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminService } from "@/services/admin.service";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ServiceError } from "@/lib/types";
import type { AuditLogEntry } from "@/lib/admin-types";

const ACTOR_TYPE_OPTIONS = ["", "USER", "BENEFICIARY", "ADMIN", "SYSTEM"];
const LIMIT = 50;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function resultBadge(result: string) {
  const isSuccess = result === "SUCCESS" || result === "success";
  return (
    <span
      className={`text-[11.5px] font-[550] px-[8px] py-[2px] rounded-full ${
        isSuccess ? "bg-green-light text-green" : "bg-red-light text-red"
      }`}
    >
      {result}
    </span>
  );
}

export default function AdminAuditLogsPage() {
  const { isAuthenticated, admin } = useAdminAuth();

  const [entries, setEntries]       = useState<AuditLogEntry[]>([]);
  const [cursor, setCursor]         = useState<string | null>(null);
  const [hasMore, setHasMore]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [exporting, setExporting]   = useState(false);

  // Filters
  const [actorType, setActorType] = useState("");
  const [fromDate, setFromDate]   = useState("");
  const [toDate, setToDate]       = useState("");

  const filtersRef = useRef({ actorType, fromDate, toDate });
  filtersRef.current = { actorType, fromDate, toDate };

  const fetchLogs = useCallback(
    (nextCursor?: string) => {
      if (!isAuthenticated) return;
      const { actorType, fromDate, toDate } = filtersRef.current;
      const isLoadMore = !!nextCursor;
      if (isLoadMore) { setLoadingMore(true); } else { setLoading(true); }
      setError(null);

      AdminService.getAuditLogs({
        cursor:  nextCursor,
        limit:   LIMIT,
        type:    actorType || undefined,
        from:    fromDate  || undefined,
        to:      toDate    || undefined,
      })
        .then((res) => {
          setEntries((prev) => isLoadMore ? [...prev, ...res.entries] : res.entries);
          setCursor(res.nextCursor);
          setHasMore(res.hasMore);
        })
        .catch((err) =>
          setError(err instanceof ServiceError ? err.message : "Failed to load audit logs.")
        )
        .finally(() => isLoadMore ? setLoadingMore(false) : setLoading(false));
    },
    [isAuthenticated]
  );

  // Refetch from scratch when filters change
  const applyFilters = () => {
    setEntries([]);
    setCursor(null);
    fetchLogs(undefined);
  };

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await AdminService.exportAuditLogs({
        type: actorType || undefined,
        from: fromDate  || undefined,
        to:   toDate    || undefined,
      });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      /* silent — user can retry */
    } finally {
      setExporting(false);
    }
  };

  if (!isAuthenticated) return null;

  const canExport = admin?.role === "SUPER_ADMIN";

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-heading text-[22px] text-text-primary">Audit Logs</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">
            {entries.length} entries loaded
          </p>
        </div>
        {canExport && (
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Export CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-end gap-3 mb-5 flex-wrap">
        <div>
          <label className="block text-[11.5px] text-text-tertiary mb-1">Actor type</label>
          <select
            value={actorType}
            onChange={(e) => setActorType(e.target.value)}
            className="px-3 py-2 text-[13px] bg-surface border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-accent"
          >
            {ACTOR_TYPE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o || "All types"}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11.5px] text-text-tertiary mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 text-[13px] bg-surface border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-[11.5px] text-text-tertiary mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 text-[13px] bg-surface border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
        <Button variant="secondary" size="sm" onClick={applyFilters}>
          Apply
        </Button>
        {(actorType || fromDate || toDate) && (
          <button
            onClick={() => {
              setActorType(""); setFromDate(""); setToDate("");
              setTimeout(applyFilters, 0);
            }}
            className="text-[12.5px] text-text-tertiary hover:text-text-primary"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border-color rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={20} className="animate-spin text-text-tertiary" />
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-[13px] text-text-secondary mb-3">{error}</p>
            <button onClick={() => fetchLogs()} className="text-[13px] text-accent hover:underline">
              Retry
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[13px] text-text-tertiary">No audit log entries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border-color">
                  {["Timestamp", "Actor", "Type", "Action", "Target", "Result"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11.5px] font-semibold text-text-tertiary tracking-[0.04em] uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-border-color last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-3 text-[12px] text-text-tertiary whitespace-nowrap">
                      {formatDate(e.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-text-secondary font-mono">
                      {e.actorId.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11.5px] font-[500] text-text-tertiary bg-surface-2 border border-border-color rounded px-2 py-0.5">
                        {e.actorType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-text-primary font-[500]">
                      {e.action}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-text-secondary">
                      {e.targetType}:{e.targetId.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3">{resultBadge(e.result)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Load more */}
      {hasMore && !loading && !error && (
        <div className="flex justify-center mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchLogs(cursor ?? undefined)}
            disabled={loadingMore}
          >
            {loadingMore
              ? <Loader2 size={13} className="animate-spin" />
              : <ChevronDown size={13} />
            }
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
