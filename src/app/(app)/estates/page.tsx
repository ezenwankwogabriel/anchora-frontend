"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  XCircle,
  Users,
  ChevronRight,
  FileText,
  Download,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEstatesStore } from "@/stores/estatesStore";
import { EstatesService } from "@/services/estates.service";
import type {
  EstateItem,
  IdentityVerificationStatus,
} from "@/lib/types/estates";
import { useToastStore } from "@/stores/toastStore";

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function relativeDate(iso: string): string {
  const date = new Date(iso);

  const days = Math.floor(
    (startOfDay(new Date()) - startOfDay(date)) / 86_400_000,
  );

  if (days === 0) return "today";

  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years >= 1) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months >= 1) return `${months} month${months > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

// ─── Verification Banner ───────────────────────────────────────────────────────

function VerificationBanner({
  status,
  rejectionReason,
}: {
  status: IdentityVerificationStatus;
  rejectionReason?: string | null;
}) {
  if (status === "UNVERIFIED") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="text-amber-600 w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900">
            Your identity is not verified.
          </p>
          <p className="text-sm text-amber-700 mt-0.5">
            Verify once to be ready for any estate you&apos;re assigned to.
          </p>
        </div>
        <Link
          href="/settings"
          className="text-amber-700 text-sm font-medium underline hover:no-underline whitespace-nowrap flex-shrink-0"
        >
          Verify identity
        </Link>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Clock className="text-blue-500 w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">
            Identity verification under review.
          </p>
          <p className="text-sm text-blue-700 mt-0.5">
            You&apos;ll be notified when complete.
          </p>
        </div>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <XCircle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-900">
            Identity verification unsuccessful.
          </p>
          <p className="text-sm text-red-700 mt-0.5">
            {rejectionReason ?? "Your documents could not be verified."}
          </p>
        </div>
        <Link
          href="/settings"
          className="text-red-700 text-sm font-medium underline hover:no-underline whitespace-nowrap flex-shrink-0"
        >
          Resubmit documents
        </Link>
      </div>
    );
  }

  return null;
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({
  estate,
  verificationStatus,
}: {
  estate: EstateItem;
  verificationStatus: IdentityVerificationStatus;
}) {
  const { release } = estate;

  if (!release) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        Designated
      </span>
    );
  }

  if (release.status === "CANCELLED") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        Release halted
      </span>
    );
  }

  if (release.reportAvailable) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        Report available
        <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1.5 inline-block" />
      </span>
    );
  }

  if (verificationStatus === "VERIFIED") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        Report being prepared
      </span>
    );
  }

  if (verificationStatus === "PENDING") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        Verification in review
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
      Action required
      <span className="w-2 h-2 rounded-full bg-amber-400 ml-1.5 inline-block" />
    </span>
  );
}

// ─── Drawer content ───────────────────────────────────────────────────────────

function DrawerDetail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-color last:border-0">
      <span className="text-xs text-text-secondary uppercase tracking-wide font-medium">
        {label}
      </span>
      <span className="text-sm text-text-primary font-medium">{value}</span>
    </div>
  );
}

function VerificationBadge({ status }: { status: IdentityVerificationStatus }) {
  const map: Record<
    IdentityVerificationStatus,
    { label: string; cls: string }
  > = {
    UNVERIFIED: { label: "Not verified", cls: "bg-amber-100 text-amber-700" },
    PENDING: { label: "Under review", cls: "bg-blue-100 text-blue-700" },
    VERIFIED: { label: "Verified", cls: "bg-emerald-100 text-emerald-700" },
    REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700" },
  };
  const { label, cls } = map[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

// ─── Estate Drawer ────────────────────────────────────────────────────────────

function EstateDrawer({
  estate,
  verificationStatus,
  open,
  onClose,
  onExited,
}: {
  estate: EstateItem | null;
  verificationStatus: IdentityVerificationStatus;
  open: boolean;
  onClose: () => void;
  onExited: (estateId: string) => void;
}) {
  const { add: addToast } = useToastStore();
  const [downloading, setDownloading] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [downloadBeforeExitDialogOpen, setDownloadBeforeExitDialogOpen] =
    useState(false);

  if (!estate) return null;

  const { release } = estate;
  const releaseInProgress =
    !!release &&
    release.status !== "COMPLETED" &&
    release.status !== "CANCELLED";

  const canExit = !releaseInProgress;
  const exitDisabledTooltip = releaseInProgress
    ? "You cannot exit an estate while a release is in progress."
    : undefined;

  async function handleDownload() {
    if (!estate?.release) return;
    setDownloading(true);
    try {
      const { url } = await EstatesService.getReport(estate.release.id);
      window.open(url, "_blank");
    } catch {
      addToast("Failed to load report. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  }

  async function confirmExit() {
    if (!estate) return;
    setExiting(true);
    try {
      await EstatesService.exitEstate(estate.estateId);
      onExited(estate.estateId);
      onClose();
      addToast("You have exited this estate.", "success");
    } catch {
      addToast("Failed to exit estate. Please try again.", "error");
    } finally {
      setExiting(false);
    }
  }

  async function downloadThenExit() {
    await handleDownload();
    setDownloadBeforeExitDialogOpen(false);
    setExitDialogOpen(true);
  }

  function openExitFlow() {
    if (release?.reportAvailable) {
      setDownloadBeforeExitDialogOpen(true);
    } else {
      setExitDialogOpen(true);
    }
  }

  // ── State 1: No release ──

  if (!release) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="max-w-md w-full">
          <SheetHeader>
            <SheetTitle>{estate.ownerName}</SheetTitle>
            <SheetDescription>Estate of {estate.ownerName}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <DrawerDetail
              label="Status"
              value={
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Designated executor
                </span>
              }
            />
            <DrawerDetail
              label="Designated on"
              value={new Date(estate.designatedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
            <DrawerDetail
              label="Your verification"
              value={<VerificationBadge status={verificationStatus} />}
            />
          </div>
          <div className="mt-4 bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-text-secondary">
              You will be notified by email if a release is triggered for this
              estate.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border-color">
            <button
              onClick={openExitFlow}
              className="w-full rounded-lg py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Exit estate
            </button>
          </div>
          <ExitDialog
            open={exitDialogOpen}
            onClose={() => setExitDialogOpen(false)}
            onConfirm={confirmExit}
            loading={exiting}
            ownerName={estate.ownerName}
          />
        </SheetContent>
      </Sheet>
    );
  }

  // ── State 2: Release triggered, unverified/rejected ──

  if (
    release.status !== "CANCELLED" &&
    !release.reportAvailable &&
    (verificationStatus === "UNVERIFIED" || verificationStatus === "REJECTED")
  ) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="max-w-md w-full">
          <SheetHeader>
            <SheetTitle>{estate.ownerName}</SheetTitle>
            <SheetDescription>Estate of {estate.ownerName}</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <DrawerDetail
              label="Status"
              value={
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Action required
                </span>
              }
            />
          </div>
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-600 w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              A release has been triggered for this estate. Verify your identity
              to access the estate report.
            </p>
          </div>
          <div className="mt-4">
            <Link href="/settings">
              <Button className="w-full rounded-lg">
                Verify your identity
              </Button>
            </Link>
          </div>
          <div className="mt-6 pt-4 border-t border-border-color">
            <div title={exitDisabledTooltip}>
              <button
                disabled={!canExit}
                className="w-full rounded-lg py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Exit estate
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // ── State 3: Release triggered, pending verification ──

  if (
    release.status !== "CANCELLED" &&
    !release.reportAvailable &&
    verificationStatus === "PENDING"
  ) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="max-w-md w-full">
          <SheetHeader>
            <SheetTitle>{estate.ownerName}</SheetTitle>
            <SheetDescription>Estate of {estate.ownerName}</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <DrawerDetail
              label="Status"
              value={
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Verification under review
                </span>
              }
            />
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Clock className="text-blue-500 w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Your identity documents are being reviewed. The estate report will
              be available once your verification is approved. You&apos;ll
              receive an email when it&apos;s ready.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border-color">
            <div title={exitDisabledTooltip}>
              <button
                disabled={!canExit}
                className="w-full rounded-lg py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Exit estate
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // ── State 4: Report available ──

  if (release.reportAvailable) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="max-w-md w-full">
          <SheetHeader>
            <SheetTitle>{estate.ownerName}</SheetTitle>
            <SheetDescription>Estate of {estate.ownerName}</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <DrawerDetail
              label="Status"
              value={
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  Report available
                </span>
              }
            />
          </div>
          <div className="mt-4 border border-border-color rounded-xl p-4 flex items-center gap-3">
            <FileText className="text-accent w-8 h-8 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">
                Estate report
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Released {relativeDate(release.triggeredAt)}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-lg px-3 py-1.5 text-sm flex items-center gap-1.5 flex-shrink-0"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Download
            </Button>
          </div>
          {release.reportExpired && (
            <p className="mt-2 text-xs text-text-secondary">
              Link expired — a fresh link will be generated when you download.
            </p>
          )}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="text-blue-500 w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Where to start
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Begin with the Legal Foundation section of the report before
                approaching any institution.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border-color">
            <button
              onClick={openExitFlow}
              className="w-full rounded-lg py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Exit estate
            </button>
          </div>
          <ExitWithReportDialog
            open={downloadBeforeExitDialogOpen}
            onClose={() => setDownloadBeforeExitDialogOpen(false)}
            onDownloadFirst={downloadThenExit}
            onExitAnyway={() => {
              setDownloadBeforeExitDialogOpen(false);
              setExitDialogOpen(true);
            }}
            downloading={downloading}
          />
          <ExitDialog
            open={exitDialogOpen}
            onClose={() => setExitDialogOpen(false)}
            onConfirm={confirmExit}
            loading={exiting}
            ownerName={estate.ownerName}
          />
        </SheetContent>
      </Sheet>
    );
  }

  // ── State 5: Release halted ──

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="max-w-md w-full">
        <SheetHeader>
          <SheetTitle>{estate.ownerName}</SheetTitle>
          <SheetDescription>Estate of {estate.ownerName}</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <DrawerDetail
            label="Status"
            value={
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                Release halted
              </span>
            }
          />
        </div>
        <div className="mt-4 bg-gray-50 rounded-xl p-4 flex items-start gap-3">
          <Info className="text-gray-400 w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-text-secondary">
            The owner has been detected as active. The release process has been
            paused.
          </p>
        </div>
        <div className="mt-6 pt-4 border-t border-border-color">
          <button
            onClick={openExitFlow}
            className="w-full rounded-lg py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Exit estate
          </button>
        </div>
        <ExitDialog
          open={exitDialogOpen}
          onClose={() => setExitDialogOpen(false)}
          onConfirm={confirmExit}
          loading={exiting}
          ownerName={estate.ownerName}
        />
      </SheetContent>
    </Sheet>
  );
}

// ─── Exit dialogs ─────────────────────────────────────────────────────────────

function ExitDialog({
  open,
  onClose,
  onConfirm,
  loading,
  ownerName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
  ownerName: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Exit this estate?</AlertDialogTitle>
          <AlertDialogDescription>
            You will be removed as executor for {ownerName}&apos;s estate. The
            owner will be notified and will need to designate a new executor.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep role</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin mr-1" />
            ) : null}
            Exit estate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ExitWithReportDialog({
  open,
  onClose,
  onDownloadFirst,
  onExitAnyway,
  downloading,
}: {
  open: boolean;
  onClose: () => void;
  onDownloadFirst: () => Promise<void>;
  onExitAnyway: () => void;
  downloading: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Exit this estate?</AlertDialogTitle>
          <AlertDialogDescription>
            You have a report available for this estate. Downloading it before
            exiting is strongly recommended — you will lose access once you
            exit. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep role</AlertDialogCancel>
          <Button
            variant="secondary"
            onClick={onDownloadFirst}
            disabled={downloading}
            className="flex items-center gap-1.5"
          >
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Download first
          </Button>
          <AlertDialogAction
            onClick={onExitAnyway}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Exit anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 bg-gray-100 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="h-6 w-24 bg-gray-100 rounded-full" />
    </div>
  );
}

// ─── Pending invite card ──────────────────────────────────────────────────────

function PendingInviteCard({
  estate,
  onAccepted,
  onDeclined,
}: {
  estate: EstateItem;
  onAccepted: (estateId: string) => void;
  onDeclined: (estateId: string) => void;
}) {
  const { add: addToast } = useToastStore();
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  async function handleAccept() {
    setAccepting(true);
    try {
      await EstatesService.acceptInvite(estate.estateId);
      onAccepted(estate.estateId);
      addToast("You've accepted the executor invitation.", "success");
    } catch {
      addToast("Failed to accept invitation. Please try again.", "error");
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    try {
      await EstatesService.declineInvite(estate.estateId);
      onDeclined(estate.estateId);
      addToast("Invitation declined.", "success");
    } catch {
      addToast("Failed to decline invitation. Please try again.", "error");
    } finally {
      setDeclining(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
            {initials(estate.ownerName)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-text-primary truncate">
              {estate.ownerName}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Invited {relativeDate(estate.designatedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDecline}
            disabled={accepting || declining}
            className="text-text-secondary hover:text-red text-xs"
          >
            {declining && <Loader2 size={12} className="animate-spin" />}
            Decline
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={accepting || declining}
          >
            {accepting && <Loader2 size={12} className="animate-spin" />}
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EstatesPage() {
  const { estates, verificationStatus, estatesLoading, fetchEstates } =
    useEstatesStore();
  const [selectedEstate, setSelectedEstate] = useState<EstateItem | null>(null);
  const [localEstates, setLocalEstates] = useState<EstateItem[]>(estates);

  useEffect(() => {
    void fetchEstates();
  }, [fetchEstates]);

  useEffect(() => {
    setLocalEstates(estates);
  }, [estates]);

  function handleExited(estateId: string) {
    setLocalEstates((prev) => prev.filter((e) => e.estateId !== estateId));
  }

  function handleInviteActioned(estateId: string) {
    setLocalEstates((prev) => prev.filter((e) => e.estateId !== estateId));
  }

  function handleAccepted(estateId: string) {
    setLocalEstates((prev) =>
      prev.map((e) =>
        e.estateId === estateId
          ? { ...e, acceptedAt: new Date().toISOString() }
          : e,
      ),
    );
  }

  const pendingEstates = localEstates.filter(
    (e) => !e.acceptedAt && !e.declinedAt,
  );
  const activeEstates = localEstates.filter((e) => !!e.acceptedAt);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-heading text-2xl text-text-primary">Estates</h1>
          {verificationStatus === "VERIFIED" && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Identity verified
            </span>
          )}
        </div>
        <p className="text-secondary text-sm mt-1">
          Estates you have been designated to manage as executor.
        </p>
      </div>

      {/* Verification banner */}
      {!estatesLoading && verificationStatus !== "VERIFIED" && (
        <VerificationBanner status={verificationStatus} />
      )}

      {/* Pending invitations */}
      {!estatesLoading && pendingEstates.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-[0.07em] mb-2">
            Pending invitations
          </p>
          <div className="space-y-3">
            {pendingEstates.map((estate) => (
              <PendingInviteCard
                key={estate.estateId}
                estate={estate}
                onAccepted={handleAccepted}
                onDeclined={handleInviteActioned}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {estatesLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : activeEstates.length === 0 && pendingEstates.length === 0 ? (
        <div className="py-12 flex flex-col items-center">
          <Users className="w-10 h-10 text-gray-300" />
          <p className="text-base font-medium text-text-secondary text-center mt-3">
            No estates assigned
          </p>
          <p className="text-sm text-text-secondary text-center mt-1">
            If someone designates you as their executor, their estate will
            appear here.
          </p>
        </div>
      ) : activeEstates.length > 0 ? (
        <div className="space-y-3">
          {activeEstates.map((estate) => (
            <button
              key={estate.estateId}
              onClick={() => setSelectedEstate(estate)}
              className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent font-semibold text-sm flex-shrink-0">
                  {initials(estate.ownerName)}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-sm text-text-primary">
                    {estate.ownerName}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Designated {relativeDate(estate.designatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center ml-3">
                <StatusPill
                  estate={estate}
                  verificationStatus={verificationStatus}
                />
                <ChevronRight className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {/* Drawer */}
      <EstateDrawer
        estate={selectedEstate}
        verificationStatus={verificationStatus}
        open={selectedEstate !== null}
        onClose={() => setSelectedEstate(null)}
        onExited={handleExited}
      />
    </div>
  );
}
