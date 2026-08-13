"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, AlertTriangle, Send, Mail, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { PaywallModal } from "@/components/ui/paywall-modal";
import { ExecutorService } from "@/services/executor.service";
import { useToastStore } from "@/stores/toastStore";
import { ServiceError } from "@/lib/types";
import { executorSchema } from "@/lib/schemas/executor";
import { trustedContactLimitFor } from "@/lib/plan-limits";
import { usePlan } from "@/hooks/usePlan";
import type { Executor, ExecutorNotificationState } from "@/lib/types";

function getNotificationState(executor: Executor): ExecutorNotificationState {
  return !executor.notifiedAt
    ? "NOT_NOTIFIED"
    : executor.emailVerifiedAt
      ? "VERIFIED"
      : "NOTIFIED";
}

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
      {text}
      {required && " *"}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11.5px] text-red mt-[5px]">{message}</p>;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Remove Confirmation Dialog ────────────────────────────────────────────────

interface RemoveDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  removing: boolean;
  wasNotified: boolean;
}

function RemoveDialog({
  onConfirm,
  onCancel,
  removing,
  wasNotified,
}: RemoveDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-surface rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-red-light flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-red" />
          </div>
          <h2 className="text-[15px] font-semibold text-text-primary">
            Remove trusted contact?
          </h2>
        </div>
        <p className="text-[13px] text-text-secondary mb-5 pl-12">
          {wasNotified
            ? "Your trusted contact will be notified that they have been removed. You can designate a new trusted contact at any time."
            : "Your trusted contact was never notified about this designation, so they won't be notified of the removal either. You can designate a new trusted contact at any time."}
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={removing}>
            Keep trusted contact
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={removing}>
            {removing && <Loader2 size={13} className="animate-spin" />}
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Designate Form ───────────────────────────────────────────────────────────

interface DesignateFormProps {
  onCreated: (executor: Executor) => void;
}

const designateSchema = executorSchema.extend({ notifyNow: z.boolean() });
type DesignateFormValues = z.infer<typeof designateSchema>;

function DesignateForm({ onCreated }: DesignateFormProps) {
  const toast = useToastStore((s) => s.add);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DesignateFormValues>({
    resolver: zodResolver(designateSchema),
    defaultValues: { notifyNow: false },
  });

  const onSubmit = async ({ notifyNow, ...values }: DesignateFormValues) => {
    let executor: Executor;
    try {
      executor = await ExecutorService.create(values);
    } catch (err) {
      if (err instanceof ServiceError && err.status === 409) {
        setError("root", { message: "This person is already one of your trusted contacts." });
      } else {
        setError("root", {
          message:
            err instanceof ServiceError ? err.message : "Something went wrong",
        });
      }
      return;
    }

    if (!notifyNow) {
      toast(
        `Trusted contact designated. Notify them whenever you're ready.`,
        "success",
      );
      onCreated(executor);
      return;
    }

    try {
      await ExecutorService.notify(executor.id);
    } catch {
      toast(
        `Trusted contact designated, but the notification failed to send.`,
        "error",
      );
      onCreated(executor);
      return;
    }

    toast(`Trusted contact designated and notified.`, "success");
    try {
      const latest = await ExecutorService.list();
      onCreated(latest.find((e) => e.id === executor.id) ?? executor);
    } catch {
      // Notification succeeded; the card just starts out stale until the next refresh.
      onCreated(executor);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-[1px]" />
        <p className="text-[13px] text-blue-800">
          Saving this never sends an email on its own. Choose below if
          you&apos;d like to notify your trusted contact right away, or do it later
          from this page.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="bg-surface border border-border-color rounded-xl shadow-sm p-6">
          <FormSection>
            <FieldLabel text="Full name" required />
            <Input placeholder="e.g. Adaeze Okafor" {...register("name")} />
            <FieldError message={errors.name?.message} />
          </FormSection>

          <FormSection>
            <FieldLabel text="Email address" required />
            <Input
              type="email"
              placeholder="trustedcontact@example.com"
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </FormSection>

          <FormSection>
            <FieldLabel text="Phone number" />
            <Input placeholder="+234 800 000 0000" {...register("phone")} />
            <FieldError message={errors.phone?.message} />
          </FormSection>

          <FormSection>
            <FieldLabel text="Relationship" />
            <Input
              placeholder="e.g. Spouse, sibling, lawyer"
              {...register("relationship")}
            />
            <FieldError message={errors.relationship?.message} />
          </FormSection>

          <label className="flex items-center gap-2 text-[13px] text-text-secondary pt-1">
            <input
              type="checkbox"
              className="h-4 w-4"
              {...register("notifyNow")}
            />
            Notify my trusted contact by email now
          </label>

          {errors.root && (
            <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mt-2">
              {errors.root.message}
            </p>
          )}

          <div className="pt-4">
            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Designate trusted contact
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Executor Card ─────────────────────────────────────────────────────────────

interface ExecutorCardProps {
  executor: Executor;
  onRemoved: () => void;
  onUpdated: (executor: Executor) => void;
}

interface StatusPresentation {
  Icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
  ctaLabel?: string;
}

// One unified status descriptor per state, rather than separate badges,
// banners, and footnotes — mirrors the "declined"/"verified"/"accepted"
// distinctions the app already tracks, just consolidated into a single
// icon + title + description block.
function getStatusPresentation(executor: Executor): StatusPresentation {
  const name = executor.name;

  if (executor.acceptedAt) {
    return {
      Icon: CheckCircle2,
      iconClassName: "bg-emerald-100 text-emerald-700",
      title: "Accepted",
      description: `${name} has confirmed and can access your release summary if a release is triggered.`,
    };
  }

  if (executor.declinedAt) {
    return {
      Icon: AlertTriangle,
      iconClassName: "bg-red-light text-red",
      title: "Declined your invitation",
      description: `${name} declined to be your trusted contact. You can notify them again or remove them and choose someone else.`,
      ctaLabel: "Notify again",
    };
  }

  const notificationState = getNotificationState(executor);

  if (notificationState === "VERIFIED") {
    return {
      Icon: CheckCircle2,
      iconClassName: "bg-[#EFF6FF] text-blue-600",
      title: "Confirmed, hasn't joined yet",
      description: `${name} confirmed their email. They just need to create an Anchora account to formally accept this role.`,
    };
  }

  if (notificationState === "NOTIFIED") {
    return {
      Icon: Mail,
      iconClassName: "bg-amber-100 text-amber-800",
      title: "Notified, not yet confirmed",
      description:
        "An unverified email never blocks or changes the release. It only means we haven't confirmed the inbox is reachable yet.",
      ctaLabel: "Notify again",
    };
  }

  return {
    Icon: Send,
    iconClassName: "bg-amber-100 text-amber-800",
    title: "Hasn't been told yet",
    description: `Letting ${name} know doesn't share any account details, just that you've chosen them for this role.`,
    ctaLabel: `Let ${name} know`,
  };
}

function ExecutorCard({ executor, onRemoved, onUpdated }: ExecutorCardProps) {
  const toast = useToastStore((s) => s.add);
  const [notifying, setNotifying] = useState(false);
  const [showRemoveDialog, setShowDialog] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Also refreshes the verification link when unverified — there's no
  // separate "resend verification" action, since it would do nothing this
  // doesn't already do.
  const handleNotify = async () => {
    setNotifying(true);
    try {
      await ExecutorService.notify(executor.id);
    } catch {
      toast("Failed to notify trusted contact", "error");
      setNotifying(false);
      return;
    }
    toast("Trusted contact notified", "success");
    try {
      const latest = await ExecutorService.list();
      const updated = latest.find((e) => e.id === executor.id);
      if (updated) onUpdated(updated);
    } catch {
      // Notification succeeded; the card just stays stale until the next refresh.
    } finally {
      setNotifying(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await ExecutorService.remove(executor.id);
      toast("Trusted contact removed", "success");
      setShowDialog(false);
      onRemoved();
    } catch {
      toast("Failed to remove trusted contact", "error");
      setRemoving(false);
    }
  };

  const status = getStatusPresentation(executor);
  const StatusIcon = status.Icon;

  return (
    <div className="bg-surface border border-border-color rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-4 pb-5 mb-5 border-b border-border-color">
        <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-lg">
            {getInitials(executor.name)}
          </span>
        </div>
        <div>
          <p className="font-semibold text-[15px] text-text-primary">
            {executor.name}
          </p>
          <p className="text-[13px] text-text-secondary">
            {executor.relationship ? `${executor.relationship} · ` : ""}
            {executor.email}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 mb-5">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${status.iconClassName}`}
        >
          <StatusIcon size={16} />
        </div>
        <div>
          <p className="font-semibold text-[14px] text-text-primary">
            {status.title}
          </p>
          <p className="text-[13px] text-text-secondary mt-1">
            {status.description}
            {executor.notifiedAt &&
              !executor.acceptedAt &&
              ` Notified ${formatDate(executor.notifiedAt)}.`}
          </p>
        </div>
      </div>

      {status.ctaLabel && (
        <div className="flex justify-center">
          <Button onClick={handleNotify} disabled={notifying}>
            {notifying ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <StatusIcon size={15} />
            )}
            {status.ctaLabel}
          </Button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className="block w-full text-center text-[13px] text-text-tertiary hover:text-red transition-colors bg-transparent border-none cursor-pointer font-sans mt-3"
      >
        Remove trusted contact
      </button>

      {showRemoveDialog && (
        <RemoveDialog
          onConfirm={handleRemove}
          onCancel={() => setShowDialog(false)}
          removing={removing}
          wasNotified={!!executor.notifiedAt}
        />
      )}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────

export default function ExecutorClient() {
  const [loading, setLoading] = useState(true);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [fetchError, setFetchError] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { isPro, loading: planLoading, refetch: refetchPlan } = usePlan();

  useEffect(() => {
    ExecutorService.list()
      .then(setExecutors)
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading || planLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <p className="text-[13px] text-red py-6">
        Failed to load trusted contact information. Please refresh.
      </p>
    );
  }

  const limit = trustedContactLimitFor(isPro);
  const atLimit = executors.length >= limit;

  function handleAddClick() {
    if (!atLimit) setShowAddForm(true);
    else if (!isPro) setShowPaywall(true);
    // Pro users at their plan cap: no-op — the "Add" button is disabled below instead.
  }

  if (executors.length === 0 && !showAddForm) {
    return (
      <>
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-[28px] text-text-primary">Trusted Contacts</h1>
            <p className="text-[13.5px] text-text-secondary mt-1">
              The people who will receive your release summary if a release is triggered.
            </p>
          </div>
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-[2px]" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-[500] text-amber-900">No trusted contact designated</p>
              <p className="text-[12px] text-amber-700">Your release summary cannot be made available without at least one trusted contact.</p>
            </div>
          </div>
          <Button onClick={handleAddClick}>Add trusted contact</Button>
        </div>
        <PaywallModal
          open={showPaywall}
          onClose={() => setShowPaywall(false)}
          reason="trustedContact"
          onUpgraded={() => { setShowPaywall(false); refetchPlan(); }}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-[28px] text-text-primary">Trusted Contacts</h1>
        <p className="text-[13.5px] text-text-secondary mt-1">
          Each contact independently receives your release summary if a release is triggered — every verified contact has equal access.
        </p>
      </div>

      {executors.map((executor) => (
        <ExecutorCard
          key={executor.id}
          executor={executor}
          onRemoved={() => setExecutors((cur) => cur.filter((e) => e.id !== executor.id))}
          onUpdated={(updated) => setExecutors((cur) => cur.map((e) => (e.id === updated.id ? updated : e)))}
        />
      ))}

      {showAddForm && (
        <DesignateForm onCreated={(e) => { setExecutors((cur) => [...cur, e]); setShowAddForm(false); }} />
      )}

      {!showAddForm && (
        atLimit && isPro ? (
          <div className="flex items-center gap-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3">
            <Info size={16} className="text-blue-500 flex-shrink-0" />
            <p className="text-[13px] text-blue-800">
              Pro plan includes up to {limit} trusted contacts. Remove one to add another.
            </p>
          </div>
        ) : (
          <Button variant="secondary" onClick={handleAddClick}>Add another trusted contact</Button>
        )
      )}

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason="trustedContact"
        onUpgraded={() => { setShowPaywall(false); refetchPlan(); }}
      />
    </div>
  );
}
