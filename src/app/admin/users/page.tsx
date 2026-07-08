"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Loader2, ChevronRight } from "lucide-react";
import { AdminService } from "@/services/admin.service";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { StatusBadge } from "@/components/ui/status-badge";
import { ServiceError } from "@/lib/types";
import type { AdminUserListItem } from "@/lib/admin-types";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All",       value: ""          },
  { label: "Active",    value: "ACTIVE"    },
  { label: "Suspended", value: "SUSPENDED" },
];

function statusVariant(isSuspended: boolean) {
  return isSuspended ? ("error" as const) : ("success" as const);
}

function statusLabel(isSuspended: boolean) {
  return isSuspended ? "Suspended" : "Active";
}

function ExecutorBadge({ executor }: { executor: AdminUserListItem["executor"] }) {
  if (!executor) {
    return <span className="text-[11.5px] font-[500] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">None</span>;
  }
  if (executor.declinedAt) {
    return <span className="text-[11.5px] font-[500] px-2 py-0.5 rounded-full bg-red-100 text-red-700">Declined</span>;
  }
  if (executor.acceptedAt) {
    return <span className="text-[11.5px] font-[500] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Accepted</span>;
  }
  if (executor.notifiedAt) {
    return <span className="text-[11.5px] font-[500] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>;
  }
  return <span className="text-[11.5px] font-[500] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Not notified</span>;
}

function PlanBadge({ plan }: { plan: AdminUserListItem["plan"] }) {
  if (plan === "PRO") {
    return <span className="text-[11.5px] font-[500] px-2 py-0.5 rounded-full bg-accent text-white">PRO</span>;
  }
  return <span className="text-[11.5px] font-[500] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">FREE</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function AdminUsersPage() {
  const { isAuthenticated } = useAdminAuth();

  const [users, setUsers]           = useState<AdminUserListItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const LIMIT = 20;

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const fetchUsers = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    AdminService.getUsers({
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      page,
      limit: LIMIT,
    })
      .then((res) => { setUsers(res.data); setTotal(res.meta.total); })
      .catch((err) =>
        setError(err instanceof ServiceError ? err.message : "Failed to load users.")
      )
      .finally(() => setLoading(false));
  }, [isAuthenticated, debouncedSearch, statusFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  if (!isAuthenticated) return null;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-[22px] text-text-primary">Users</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">{total} total accounts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-8 pr-3 py-2 text-[13px] bg-surface border border-border-color rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex border border-border-color rounded-lg overflow-hidden bg-surface">
          {STATUS_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`px-3 py-2 text-[12.5px] font-[500] transition-colors ${
                statusFilter === value
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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
            <button
              onClick={fetchUsers}
              className="text-[13px] text-accent hover:underline"
            >
              Retry
            </button>
          </div>
        ) : !users || users.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[13px] text-text-tertiary">No users found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-color">
                {["Name", "Email", "Status", "Executor", "Plan", "Joined", "Vault records", ""].map((h) => (
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
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border-color last:border-0 hover:bg-surface-2 transition-colors"
                >
                  <td className="px-5 py-3.5 text-[13.5px] font-[500] text-text-primary whitespace-nowrap">
                    {u.name}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-text-secondary">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge
                      variant={statusVariant(u.isSuspended)}
                      label={statusLabel(u.isSuspended)}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <ExecutorBadge executor={u.executor} />
                  </td>
                  <td className="px-5 py-3.5">
                    <PlanBadge plan={u.plan} />
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-text-secondary whitespace-nowrap">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-text-secondary">
                    {u.vaultItemCount}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
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

      {/* Pagination */}
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
