"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { ExecutorService } from "@/services/executor.service";
import { useToastStore } from "@/stores/toastStore";
import { ServiceError } from "@/lib/types";
import { executorSchema } from "@/lib/schemas/executor";
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

// ── Designate Form (State A) ──────────────────────────────────────────────────

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
    try {
      const executor = await ExecutorService.create(values);

      if (notifyNow) {
        try {
          await ExecutorService.notify();
          toast(`Trusted contact designated and notified.`, "success");
        } catch {
          toast(
            `Trusted contact designated, but the notification failed to send.`,
            "error",
          );
        }
      } else {
        toast(
          `Trusted contact designated. Notify them whenever you're ready.`,
          "success",
        );
      }

      onCreated(executor);
    } catch (err) {
      if (err instanceof ServiceError && err.status === 409) {
        setError("root", { message: "A trusted contact is already designated." });
      } else {
        setError("root", {
          message:
            err instanceof ServiceError ? err.message : "Something went wrong",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-[28px] text-text-primary">
          Designate your trusted contact
        </h1>
        <p className="text-[13.5px] text-text-secondary mt-1">
          Your trusted contact is the person who will receive your estate report and
          manage the recovery process if your vault becomes inactive. Choose
          someone you trust completely.
        </p>
      </div>

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

// ── Executor Card (State B) ───────────────────────────────────────────────────

interface ExecutorCardProps {
  executor: Executor;
  onRemoved: () => void;
  onUpdated: (executor: Executor) => void;
}

function getNotificationBadge(state: ExecutorNotificationState): {
  label: string;
  className: string;
} {
  switch (state) {
    case "NOT_NOTIFIED":
      return {
        label: "Not yet notified",
        className: "bg-surface-2 text-text-tertiary",
      };
    case "NOTIFIED":
      return {
        label: "Notified · email unverified",
        className: "bg-amber-100 text-amber-800",
      };
    case "VERIFIED":
      return {
        label: "Notified · email verified",
        className: "bg-emerald-100 text-emerald-700",
      };
  }
}

function ExecutorCard({ executor, onRemoved, onUpdated }: ExecutorCardProps) {
  const toast = useToastStore((s) => s.add);
  const [notifying, setNotifying] = useState(false);
  const [showRemoveDialog, setShowDialog] = useState(false);
  const [removing, setRemoving] = useState(false);

  const refresh = async () => {
    const latest = await ExecutorService.get();
    if (latest) onUpdated(latest);
  };

  // Also refreshes the verification link when unverified — there's no
  // separate "resend verification" action, since it would do nothing this
  // doesn't already do.
  const handleNotify = async () => {
    setNotifying(true);
    try {
      await ExecutorService.notify();
      toast("Trusted contact notified", "success");
      await refresh();
    } catch {
      toast("Failed to notify trusted contact", "error");
    } finally {
      setNotifying(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await ExecutorService.remove();
      toast("Trusted contact removed", "success");
      setShowDialog(false);
      onRemoved();
    } catch {
      toast("Failed to remove trusted contact", "error");
      setRemoving(false);
    }
  };

  function getResponseBadge(): { label: string; className: string } | null {
    if (executor.acceptedAt) {
      return {
        label: "Accepted",
        className: "bg-emerald-100 text-emerald-700",
      };
    }
    if (executor.declinedAt) {
      return { label: "Declined", className: "bg-red-light text-red" };
    }
    // Not yet responded — already conveyed by the notification badge.
    return null;
  }

  const isDeclined = !!executor.declinedAt;
  const isAccepted = !!executor.acceptedAt;
  const responseBadge = getResponseBadge();
  const notificationState = getNotificationState(executor);
  const notificationBadge = getNotificationBadge(notificationState);
  // Once accepted (account holders) or verified (no-account executors),
  // there's nothing left for a re-notify to accomplish.
  const canNotify = !isAccepted && notificationState !== "VERIFIED";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-[28px] text-text-primary">
          Your trusted contact
        </h1>
        <p className="text-[13.5px] text-text-secondary mt-1">
          This person will receive your estate report if a release is triggered.
        </p>
      </div>

      {isDeclined && (
        <div className="flex items-start gap-3 bg-red-light border border-[#F5B0B0] rounded-xl p-4">
          <AlertTriangle
            size={16}
            className="text-red flex-shrink-0 mt-[1px]"
          />
          <p className="text-[13px] text-red">
            <strong>{executor.name}</strong> declined your trusted contact invitation.
            You can notify them again or remove them and designate someone else.
          </p>
        </div>
      )}

      <div className="bg-surface border border-border-color rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
            <span className="text-navy font-semibold text-lg">
              {getInitials(executor.name)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-[15px] text-text-primary">
              {executor.name}
            </p>
            <p className="text-[13px] text-text-secondary">{executor.email}</p>
            {executor.relationship && (
              <p className="text-[13px] text-text-secondary">
                {executor.relationship}
              </p>
            )}
          </div>
        </div>

        <div className="mb-1 flex flex-wrap gap-2">
          {responseBadge && (
            <span
              className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full ${responseBadge.className}`}
            >
              {responseBadge.label}
            </span>
          )}
          {!isAccepted && (
            <span
              className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full ${notificationBadge.className}`}
            >
              {notificationBadge.label}
            </span>
          )}
        </div>

        <p className="text-[11.5px] text-text-tertiary mb-1">
          {executor.notifiedAt && `Notified ${formatDate(executor.notifiedAt)}`}
        </p>

        {!isAccepted && notificationState === "NOTIFIED" && (
          <p className="text-[11.5px] text-text-tertiary mb-4">
            An unverified email never blocks or changes the release — it only
            means we haven&apos;t confirmed the inbox is reachable yet.
          </p>
        )}
        {(isAccepted || notificationState !== "NOTIFIED") && (
          <div className="mb-4" />
        )}

        <div className="border-t border-border-color mb-4" />

        <div className="flex gap-2 flex-wrap">
          {canNotify && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNotify}
              disabled={notifying}
            >
              {notifying && <Loader2 size={13} className="animate-spin" />}
              {executor.notifiedAt ? "Notify again" : "Notify trusted contact"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDialog(true)}
            className="text-red-600 hover:bg-red-50"
          >
            Remove trusted contact
          </Button>
        </div>
      </div>

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
  const [executor, setExecutor] = useState<Executor | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    ExecutorService.get()
      .then((data) => setExecutor(data ?? null))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
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

  if (executor === null) {
    return <DesignateForm onCreated={(e) => setExecutor(e)} />;
  }

  return (
    <ExecutorCard
      executor={executor}
      onRemoved={() => setExecutor(null)}
      onUpdated={(e) => setExecutor(e)}
    />
  );
}
