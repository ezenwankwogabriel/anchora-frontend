"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ShieldOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminService } from "@/services/admin.service";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ServiceError } from "@/lib/types";
import type { AdminUserDetail, ReleaseStatus, UserPlan } from "@/lib/admin-types";

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
  const [planOverride, setPlanOverride]   = useState<UserPlan>("FREE");
  const [planLoading, setPlanLoading]     = useState(false);
  const [planFeedback, setPlanFeedback]   = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    AdminService.getUser(userId)
      .then((u) => { setUser(u); setPlanOverride(u.plan); })
      .catch((err) =>
        setError(err instanceof ServiceError ? err.message : "Failed to load user.")
      )
      .finally(() => setLoading(false));
  }, [isAuthenticated, userId]);

  const handlePlanUpdate = async () => {
    if (!user) return;
    setPlanLoading(true);
    setPlanFeedback(null);
    try {
      await AdminService.updateUserPlan(userId, planOverride);
      setUser((u) => u ? { ...u, plan: planOverride } : u);
      setPlanFeedback({ ok: true, msg: "Plan updated." });
    } catch (err) {
      setPlanFeedback({ ok: false, msg: err instanceof ServiceError ? err.message : "Failed to update plan." });
    } finally {
      setPlanLoading(false);
    }
  };

  const handleSuspend = async (reason: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await AdminService.suspendUser(userId, reason);
      setUser((u) => u ? { ...u, isSuspended: true } : u);
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
      setUser((u) => u ? { ...u, isSuspended: false } : u);
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
  const isSuperAdmin = admin?.role === "SUPER_ADMIN";

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
            {user.name}
          </h1>
          <p className="text-[13.5px] text-text-secondary mt-0.5">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge
            variant={user.isSuspended ? "error" : "success"}
            label={user.isSuspended ? "Suspended" : "Active"}
          />
          {canAct && !user.isSuspended && (
            <Button variant="danger" onClick={() => setShowSuspend(true)}>
              <ShieldOff size={14} />
              Suspend
            </Button>
          )}
          {canAct && user.isSuspended && (
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
            <DetailRow label="Full name"      value={user.name} />
            <DetailRow label="Email"          value={user.email} />
            <DetailRow label="Email verified" value={user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "Not verified"} />
            <DetailRow label="MFA"            value={user.mfaEnabled ? "Enabled" : "Disabled"} />
            <DetailRow label="Joined"         value={formatDate(user.createdAt)} />
            <DetailRow label="Last activity"  value={formatDate(user.lastActiveAt)} />
            <DetailRow label="Vault records"  value={user.vaultItemCount} />
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
                  <p className="text-[12.5px] text-text-primary font-[500]">
                    {formatDate(r.triggeredAt)}
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={releaseVariant(r.status)} label={r.status} />
                    <a href={`/admin/releases/${r.id}`} className="text-[12px] text-accent hover:underline">
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Executor, Identity & Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* Executor */}
        <div className="bg-surface border border-border-color rounded-xl p-5">
          <h2 className="text-[14px] font-semibold text-text-primary mb-3">Executor</h2>
          {user.executor ? (
            <div>
              <DetailRow label="Name"          value={user.executor.name} />
              <DetailRow label="Email"         value={user.executor.email} />
              {user.executor.relationship && (
                <DetailRow label="Relationship" value={user.executor.relationship} />
              )}
              <DetailRow
                label="Status"
                value={
                  <span className={`text-[11.5px] font-[500] px-2 py-0.5 rounded-full ${
                    user.executor.declinedAt
                      ? "bg-red-100 text-red-700"
                      : user.executor.acceptedAt
                      ? "bg-emerald-100 text-emerald-700"
                      : user.executor.notifiedAt
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {user.executor.declinedAt
                      ? "Declined"
                      : user.executor.acceptedAt
                      ? "Accepted"
                      : user.executor.notifiedAt
                      ? "Pending"
                      : "Not notified"}
                  </span>
                }
              />
              <DetailRow label="Invited"          value={formatDate(user.executor.invitedAt)} />
              <DetailRow
                label="Notified"
                value={user.executor.notifiedAt ? formatDate(user.executor.notifiedAt) : "Not yet notified"}
              />
              <DetailRow
                label="Email verified"
                value={user.executor.emailVerifiedAt ? formatDate(user.executor.emailVerifiedAt) : "Not verified"}
              />
              {user.executor.acceptedAt && (
                <DetailRow label="Accepted" value={formatDate(user.executor.acceptedAt)} />
              )}
              {user.executor.declinedAt && (
                <DetailRow label="Declined" value={formatDate(user.executor.declinedAt)} />
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-[12.5px] text-amber-800">
                No executor designated. This user&apos;s release summary cannot be made available without one.
              </p>
            </div>
          )}
        </div>

        {/* Identity Verification */}
        <div className="bg-surface border border-border-color rounded-xl p-5">
          <h2 className="text-[14px] font-semibold text-text-primary mb-3">Identity verification</h2>
          <DetailRow
            label="Status"
            value={
              <span className={`text-[11.5px] font-[500] px-2 py-0.5 rounded-full ${
                user.govIdVerificationStatus === "VERIFIED"
                  ? "bg-emerald-100 text-emerald-700"
                  : user.govIdVerificationStatus === "FAILED"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {user.govIdVerificationStatus}
              </span>
            }
          />
          {user.govIdVerifiedAt && (
            <DetailRow label="Verified at" value={formatDate(user.govIdVerifiedAt)} />
          )}
          <p className="text-[12px] text-text-tertiary mt-3 pt-3 border-t border-border-color">
            Set only by a real NIN + selfie match via Dojah. No admin override.
          </p>
        </div>

        {/* Plan */}
        <div className="bg-surface border border-border-color rounded-xl p-5">
          <h2 className="text-[14px] font-semibold text-text-primary mb-3">Plan</h2>
          <DetailRow
            label="Current plan"
            value={
              <span className={`text-[11.5px] font-[500] px-2 py-0.5 rounded-full ${
                user.plan === "PRO" ? "bg-accent text-white" : "bg-gray-100 text-gray-600"
              }`}>
                {user.plan}
              </span>
            }
          />
          {user.planActivatedAt && (
            <DetailRow label="Activated"  value={formatDate(user.planActivatedAt)} />
          )}
          {user.paidUntil && (
            <DetailRow label="Expires"    value={formatDate(user.paidUntil)} />
          )}

          {isSuperAdmin && (
            <div className="mt-4 pt-4 border-t border-border-color">
              <p className="text-[12px] font-semibold text-text-tertiary mb-2 tracking-[0.03em] uppercase">Override plan</p>
              <div className="flex items-center gap-2">
                <select
                  value={planOverride}
                  onChange={(e) => setPlanOverride(e.target.value as UserPlan)}
                  className="px-3 py-2 text-[13px] bg-surface border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                </select>
                <Button
                  size="sm"
                  onClick={handlePlanUpdate}
                  disabled={planLoading || planOverride === user.plan}
                >
                  {planLoading && <Loader2 size={13} className="animate-spin" />}
                  Update plan
                </Button>
              </div>
              {planFeedback && (
                <p className={`text-[12px] mt-2 ${planFeedback.ok ? "text-green-700" : "text-red"}`}>
                  {planFeedback.msg}
                </p>
              )}
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
