"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ChevronRight } from "lucide-react";
import { AdminService } from "@/services/admin.service";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { StatusBadge } from "@/components/ui/status-badge";
import { ServiceError } from "@/lib/types";
import type { AdminRelease, ReleaseStatus } from "@/lib/admin-types";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All",       value: ""          },
  { label: "Pending",   value: "PENDING"   },
  { label: "Active",    value: "ACTIVE"    },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function releaseVariant(status: ReleaseStatus) {
  switch (status) {
    case "PENDING":   return "warning" as const;
    case "ACTIVE":    return "info"    as const;
    case "COMPLETED": return "success" as const;
    case "CANCELLED": return "error"   as const;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const LIMIT = 20;

export default function AdminReleasesPage() {
  const { isAuthenticated } = useAdminAuth();

  const [releases, setReleases]   = useState<AdminRelease[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [statusFilter, setStatus] = useState("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => { setPage(1); }, [statusFilter]);

  const fetchReleases = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    AdminService.getReleases({
      status: statusFilter || undefined,
      page,
      limit: LIMIT,
    })
      .then((res) => { setReleases(res.data); setTotal(res.meta.total); })
      .catch((err) =>
        setError(err instanceof ServiceError ? err.message : "Failed to load releases.")
      )
      .finally(() => setLoading(false));
  }, [isAuthenticated, statusFilter, page]);

  useEffect(() => { fetchReleases(); }, [fetchReleases]);

  if (!isAuthenticated) return null;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-[22px] text-text-primary">Releases</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">{total} total releases</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex border-b border-border-color mb-5">
        {STATUS_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setStatus(value)}
            className={`px-4 py-2.5 text-[13px] font-[500] border-b-2 -mb-px transition-colors ${
              statusFilter === value
                ? "border-accent text-accent font-semibold"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
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
            <button onClick={fetchReleases} className="text-[13px] text-accent hover:underline">
              Retry
            </button>
          </div>
        ) : releases.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[13px] text-text-tertiary">No releases found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-color">
                {["Account owner", "Status", "Executor", "Triggered", "Completed", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11.5px] font-semibold text-text-tertiary tracking-[0.04em] uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {releases.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border-color last:border-0 hover:bg-surface-2 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <p className="text-[13.5px] font-[500] text-text-primary whitespace-nowrap">
                      {r.userName}
                    </p>
                    <p className="text-[12px] text-text-tertiary">{r.userEmail}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge variant={releaseVariant(r.status)} label={r.status} />
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-text-secondary whitespace-nowrap">
                    {r.executor ? r.executor.name : <span className="text-text-tertiary">None designated</span>}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-text-secondary whitespace-nowrap">
                    {formatDate(r.triggeredAt)}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-text-secondary whitespace-nowrap">
                    {formatDate(r.completedAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/releases/${r.id}`}
                      className="inline-flex items-center gap-1 text-[12.5px] text-accent hover:underline"
                    >
                      View <ChevronRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && !loading && !error && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[12.5px] text-text-tertiary">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-[12.5px] border border-border-color rounded-lg text-text-secondary hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-[12.5px] border border-border-color rounded-lg text-text-secondary hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
