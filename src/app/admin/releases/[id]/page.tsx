"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminService } from "@/services/admin.service";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ServiceError } from "@/lib/types";
import type {
  AdminReleaseDetail,
  ReleaseStatus,
  VerificationStatus,
} from "@/lib/admin-types";

function releaseVariant(status: ReleaseStatus) {
  switch (status) {
    case "PENDING":   return "warning" as const;
    case "ACTIVE":    return "info"    as const;
    case "COMPLETED": return "success" as const;
    case "CANCELLED": return "error"   as const;
  }
}

function verificationVariant(status: VerificationStatus) {
  switch (status) {
    case "PENDING":              return "warning" as const;
    case "SUBMITTED":            return "info"    as const;
    case "RESUBMITTED":          return "info"    as const;
    case "APPROVED":             return "success" as const;
    case "REJECTED":             return "error"   as const;
    case "PERMANENTLY_REJECTED": return "error"   as const;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ── Cancel modal ──────────────────────────────────────────────────────────────

function CancelModal({
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
        <h2 className="font-heading text-[19px] text-text-primary mb-2">Cancel release</h2>
        <p className="text-[13px] text-text-secondary mb-5">
          This will halt the release process. Beneficiaries will be notified that the release
          has been cancelled.
        </p>
        <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
          Reason *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Account owner dispute…"
          className="w-full px-3 py-2 text-[13px] bg-surface border border-border-color rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-none mb-5"
        />
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
            Go back
          </Button>
          <Button
            variant="danger"
            fullWidth
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason.trim())}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Cancel release
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminReleaseDetailPage() {
  const params    = useParams();
  const router    = useRouter();
  const releaseId = params.id as string;
  const { isAuthenticated, admin } = useAdminAuth();

  const [release, setRelease]         = useState<AdminReleaseDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [showCancel, setShowCancel]   = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    AdminService.getRelease(releaseId)
      .then(setRelease)
      .catch((err) =>
        setError(err instanceof ServiceError ? err.message : "Failed to load release.")
      )
      .finally(() => setLoading(false));
  }, [isAuthenticated, releaseId]);

  const handleCancel = async (reason: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await AdminService.cancelRelease(releaseId, reason);
      setRelease((r) =>
        r ? { ...r, status: "CANCELLED", cancelReason: reason, cancelledAt: new Date().toISOString() } : r
      );
      setShowCancel(false);
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

  if (error || !release) {
    return (
      <div className="bg-surface border border-border-color rounded-xl p-10 text-center">
        <p className="text-[13px] text-text-secondary">{error ?? "Release not found."}</p>
      </div>
    );
  }

  const canCancel =
    (admin?.role === "ADMIN" || admin?.role === "SUPER_ADMIN") &&
    (release.status === "PENDING" || release.status === "ACTIVE");

  return (
    <div>
      <button
        onClick={() => router.push("/admin/releases")}
        className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to releases
      </button>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-heading text-[22px] text-text-primary">
            Release — {release.userName}
          </h1>
          <p className="text-[13.5px] text-text-secondary mt-0.5">{release.userEmail}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge variant={releaseVariant(release.status)} label={release.status} />
          {canCancel && (
            <Button variant="danger" onClick={() => setShowCancel(true)}>
              <XCircle size={14} />
              Cancel release
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
        {/* Details */}
        <div className="lg:col-span-1 bg-surface border border-border-color rounded-xl p-5">
          <h2 className="text-[14px] font-semibold text-text-primary mb-3">Details</h2>
          <div className="space-y-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-text-tertiary">Triggered</span>
              <span className="text-text-primary">{formatDate(release.triggeredAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Completed</span>
              <span className="text-text-primary">{formatDate(release.completedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Cancelled</span>
              <span className="text-text-primary">{formatDate(release.cancelledAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Empty vault</span>
              <span className="text-text-primary">{release.emptyVault ? "Yes" : "No"}</span>
            </div>
            {release.cancelReason && (
              <div className="pt-2 border-t border-border-color">
                <p className="text-text-tertiary mb-1">Cancel reason</p>
                <p className="text-text-primary">{release.cancelReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Beneficiaries */}
        <div className="lg:col-span-2 bg-surface border border-border-color rounded-xl p-5">
          <h2 className="text-[14px] font-semibold text-text-primary mb-3">
            Beneficiaries ({release.beneficiaries.length})
          </h2>
          {release.beneficiaries.length === 0 ? (
            <p className="text-[13px] text-text-tertiary">No beneficiaries on this release.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-color">
                  {["Name", "Email", "Verification", "Submitted", "Reviewed"].map((h) => (
                    <th
                      key={h}
                      className="pb-2 text-left text-[11.5px] font-semibold text-text-tertiary tracking-[0.04em] uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {release.beneficiaries.map((b) => (
                  <tr key={b.id} className="border-b border-border-color last:border-0">
                    <td className="py-3 pr-4 text-[13px] font-[500] text-text-primary whitespace-nowrap">
                      {b.name}
                    </td>
                    <td className="py-3 pr-4 text-[12.5px] text-text-secondary">{b.email}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge
                        variant={verificationVariant(b.verificationStatus)}
                        label={b.verificationStatus.replace("_", " ")}
                      />
                    </td>
                    <td className="py-3 pr-4 text-[12.5px] text-text-secondary whitespace-nowrap">
                      {formatDate(b.submittedAt)}
                    </td>
                    <td className="py-3 text-[12.5px] text-text-secondary whitespace-nowrap">
                      {formatDate(b.reviewedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCancel && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
