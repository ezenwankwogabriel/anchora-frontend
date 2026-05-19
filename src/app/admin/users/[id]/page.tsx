"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ShieldOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminService } from "@/services/admin.service";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ServiceError } from "@/lib/types";
import type { AdminUserDetail, AccountStatus, ReleaseStatus } from "@/lib/admin-types";

function statusVariant(status: AccountStatus) {
  switch (status) {
    case "ACTIVE":           return "success" as const;
    case "SUSPENDED":        return "error"   as const;
    case "PENDING_DELETION": return "warning" as const;
    case "DELETED":          return "error"   as const;
  }
}

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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-border-color last:border-0">
      <span className="text-[12.5px] text-text-tertiary w-36 flex-shrink-0">{label}</span>
      <span className="text-[13.5px] text-text-primary flex-1">{value}</span>
    </div>
  );
}

// ── Suspend modal ─────────────────────────────────────────────────────────────

function SuspendModal({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 bg-surface rounded-2xl border border-border-color shadow-md w-full max-w-[420px] p-6">
        <h2 className="font-heading text-[19px] text-text-primary mb-2">Suspend account</h2>
        <p className="text-[13px] text-text-secondary mb-5">
          Provide a reason for suspending this account. The user will not be able to log in
          until their account is reactivated.
        </p>
        <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
          Reason *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Suspicious activity detected…"
          className="w-full px-3 py-2 text-[13px] bg-surface border border-border-color rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-none mb-5"
        />
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason.trim())}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Suspend account
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Reactivate modal ──────────────────────────────────────────────────────────

function ReactivateModal({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 bg-surface rounded-2xl border border-border-color shadow-md w-full max-w-[400px] p-6">
        <h2 className="font-heading text-[19px] text-text-primary mb-2">Reactivate account</h2>
        <p className="text-[13px] text-text-secondary mb-6">
          This will restore the user&apos;s access to their account.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button fullWidth onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            Reactivate
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const params              = useParams();
  const router              = useRouter();
  const userId              = params.id as string;
  const { isAuthenticated, admin } = useAdminAuth();

  const [user, setUser]             = useState<AdminUserDetail | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [showSuspend, setShowSuspend]     = useState(false);
  const [showReactivate, setShowReactivate] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    AdminService.getUser(userId)
      .then(setUser)
      .catch((err) =>
        setError(err instanceof ServiceError ? err.message : "Failed to load user.")
      )
      .finally(() => setLoading(false));
  }, [isAuthenticated, userId]);

  const handleSuspend = async (reason: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await AdminService.suspendUser(userId, reason);
      setUser((u) => u ? { ...u, status: "SUSPENDED" } : u);
      setShowSuspend(false);
    } catch (err) {
      setActionError(err instanceof ServiceError ? err.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await AdminService.reactivateUser(userId);
      setUser((u) => u ? { ...u, status: "ACTIVE" } : u);
      setShowReactivate(false);
    } catch (err) {
      setActionError(err instanceof ServiceError ? err.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={20} className="animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="bg-surface border border-border-color rounded-xl p-10 text-center">
        <p className="text-[13px] text-text-secondary">{error ?? "User not found."}</p>
      </div>
    );
  }

  const canAct = admin?.role === "ADMIN" || admin?.role === "SUPER_ADMIN";

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => router.push("/admin/users")}
        className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to users
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-heading text-[22px] text-text-primary">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-[13.5px] text-text-secondary mt-0.5">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge
            variant={statusVariant(user.status)}
            label={user.status.replace("_", " ")}
          />
          {canAct && user.status === "ACTIVE" && (
            <Button variant="danger" onClick={() => setShowSuspend(true)}>
              <ShieldOff size={14} />
              Suspend
            </Button>
          )}
          {canAct && user.status === "SUSPENDED" && (
            <Button onClick={() => setShowReactivate(true)}>
              <ShieldCheck size={14} />
              Reactivate
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-5">
          {actionError}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile details */}
        <div className="lg:col-span-2 bg-surface border border-border-color rounded-xl p-5">
          <h2 className="text-[14px] font-semibold text-text-primary mb-1">Account details</h2>
          <div className="mt-3">
            <DetailRow label="Full name"       value={`${user.firstName} ${user.lastName}`} />
            <DetailRow label="Email"           value={user.email} />
            <DetailRow label="Email verified"  value={user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "Not verified"} />
            <DetailRow label="MFA"             value={user.mfaEnabled ? "Enabled" : "Disabled"} />
            <DetailRow label="Joined"          value={formatDate(user.createdAt)} />
            <DetailRow label="Last activity"   value={formatDate(user.lastActivityAt)} />
            <DetailRow label="Vault records"   value={user.vaultRecordCount} />
            <DetailRow label="Beneficiaries"   value={user.beneficiaryCount} />
          </div>
        </div>

        {/* Releases */}
        <div className="bg-surface border border-border-color rounded-xl p-5">
          <h2 className="text-[14px] font-semibold text-text-primary mb-3">Releases</h2>
          {user.releases.length === 0 ? (
            <p className="text-[13px] text-text-tertiary">No releases found.</p>
          ) : (
            <div className="space-y-3">
              {user.releases.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-border-color last:border-0"
                >
                  <div>
                    <p className="text-[12.5px] text-text-primary font-[500]">
                      {formatDate(r.triggeredAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={releaseVariant(r.status)} label={r.status} />
                    <a
                      href={`/admin/releases/${r.id}`}
                      className="text-[12px] text-accent hover:underline"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSuspend && (
        <SuspendModal
          onConfirm={handleSuspend}
          onClose={() => setShowSuspend(false)}
          loading={actionLoading}
        />
      )}
      {showReactivate && (
        <ReactivateModal
          onConfirm={handleReactivate}
          onClose={() => setShowReactivate(false)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
