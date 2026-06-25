"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { ExecutorService } from "@/services/executor.service";
import { useToastStore } from "@/stores/toastStore";
import { ServiceError } from "@/lib/types";
import { executorSchema, type ExecutorFormData } from "@/lib/schemas/executor";
import type { Executor } from "@/lib/types";

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
      {text}{required && " *"}
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
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Remove Confirmation Dialog ────────────────────────────────────────────────

interface RemoveDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  removing: boolean;
}

function RemoveDialog({ onConfirm, onCancel, removing }: RemoveDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-surface rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-red-light flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-red" />
          </div>
          <h2 className="text-[15px] font-semibold text-text-primary">Remove executor?</h2>
        </div>
        <p className="text-[13px] text-text-secondary mb-5 pl-12">
          Your executor will be notified that they have been removed. You can designate a new
          executor at any time.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={removing}>
            Keep executor
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

function DesignateForm({ onCreated }: DesignateFormProps) {
  const toast = useToastStore((s) => s.add);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ExecutorFormData>({ resolver: zodResolver(executorSchema) });

  const onSubmit = async (values: ExecutorFormData) => {
    try {
      const executor = await ExecutorService.create(values);
      toast(`Invitation sent to ${values.email}`, "success");
      onCreated(executor);
    } catch (err) {
      if (err instanceof ServiceError && err.status === 409) {
        setError("root", { message: "An executor is already designated." });
      } else {
        setError("root", {
          message: err instanceof ServiceError ? err.message : "Something went wrong",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-[28px] text-text-primary">Designate your executor</h1>
        <p className="text-[13.5px] text-text-secondary mt-1">
          Your executor is the person who will receive your estate report and manage the recovery
          process if your vault becomes inactive. Choose someone you trust completely.
        </p>
      </div>

      <div className="flex items-start gap-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-[1px]" />
        <p className="text-[13px] text-blue-800">
          Your executor does not need to do anything right now. They will only be contacted if a
          release is triggered after an extended period of inactivity.
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
            <Input type="email" placeholder="executor@example.com" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </FormSection>

          <FormSection>
            <FieldLabel text="Phone number" />
            <Input placeholder="+234 800 000 0000" {...register("phone")} />
            <FieldError message={errors.phone?.message} />
          </FormSection>

          <FormSection>
            <FieldLabel text="Relationship" />
            <Input placeholder="e.g. Spouse, sibling, lawyer" {...register("relationship")} />
            <FieldError message={errors.relationship?.message} />
          </FormSection>

          {errors.root && (
            <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mt-2">
              {errors.root.message}
            </p>
          )}

          <div className="pt-4">
            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Send invitation
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
}

function ExecutorCard({ executor, onRemoved }: ExecutorCardProps) {
  const toast = useToastStore((s) => s.add);
  const [resending, setResending]         = useState(false);
  const [showRemoveDialog, setShowDialog] = useState(false);
  const [removing, setRemoving]           = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await ExecutorService.resendInvite();
      toast("Invitation resent", "success");
    } catch {
      toast("Failed to resend invitation", "error");
    } finally {
      setResending(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await ExecutorService.remove();
      toast("Executor removed", "success");
      setShowDialog(false);
      onRemoved();
    } catch {
      toast("Failed to remove executor", "error");
      setRemoving(false);
    }
  };

  function getStatusBadge(status: typeof executor.status): { label: string; className: string } {
    switch (status) {
      case "PENDING_INVITE":
        return { label: "Invitation pending", className: "bg-amber-100 text-amber-800" };
      case "ACTIVE":
        return { label: "Active", className: "bg-emerald-100 text-emerald-700" };
      case "DECLINED":
        return { label: "Declined", className: "bg-red-light text-red" };
      case "REMOVED":
        return { label: "Removed", className: "bg-surface-2 text-text-tertiary" };
      default: {
        // compile-time guard: if a new status is added to ExecutorStatus, TypeScript
        // will error here until this switch is updated
        ((_: never) => {})(status);
        return { label: "Unknown", className: "bg-surface-2 text-text-tertiary" };
      }
    }
  }

  const isPending  = executor.status === "PENDING_INVITE";
  const isDeclined = executor.status === "DECLINED";
  const statusBadge = getStatusBadge(executor.status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-[28px] text-text-primary">Your executor</h1>
        <p className="text-[13.5px] text-text-secondary mt-1">
          This person will receive your estate report if a release is triggered.
        </p>
      </div>

      {isDeclined && (
        <div className="flex items-start gap-3 bg-red-light border border-[#F5B0B0] rounded-xl p-4">
          <AlertTriangle size={16} className="text-red flex-shrink-0 mt-[1px]" />
          <p className="text-[13px] text-red">
            <strong>{executor.name}</strong> declined your executor invitation. You can resend
            the invitation or remove them and designate someone else.
          </p>
        </div>
      )}

      <div className="bg-surface border border-border-color rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
            <span className="text-navy font-semibold text-lg">{getInitials(executor.name)}</span>
          </div>
          <div>
            <p className="font-semibold text-[15px] text-text-primary">{executor.name}</p>
            <p className="text-[13px] text-text-secondary">{executor.email}</p>
            {executor.relationship && (
              <p className="text-[13px] text-text-secondary">{executor.relationship}</p>
            )}
          </div>
        </div>

        <div className="mb-1">
          <span className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>

        <p className="text-[11.5px] text-text-tertiary mb-4">
          Invitation sent {formatDate(executor.invitedAt)}
        </p>

        <div className="border-t border-border-color mb-4" />

        <div className="flex gap-2 flex-wrap">
          {(isPending || isDeclined) && (
            <Button variant="secondary" size="sm" onClick={handleResend} disabled={resending}>
              {resending && <Loader2 size={13} className="animate-spin" />}
              Resend invitation
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDialog(true)}
            className="text-red-600 hover:bg-red-50"
          >
            Remove executor
          </Button>
        </div>
      </div>

      {showRemoveDialog && (
        <RemoveDialog
          onConfirm={handleRemove}
          onCancel={() => setShowDialog(false)}
          removing={removing}
        />
      )}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────

export default function ExecutorClient() {
  const [loading, setLoading]       = useState(true);
  const [executor, setExecutor]     = useState<Executor | null>(null);
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
        Failed to load executor information. Please refresh.
      </p>
    );
  }

  if (executor === null) {
    return <DesignateForm onCreated={(e) => setExecutor(e)} />;
  }

  return <ExecutorCard executor={executor} onRemoved={() => setExecutor(null)} />;
}
