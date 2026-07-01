"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { useToastStore } from "@/stores/toastStore";
import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2, ShieldCheck, ShieldOff, Check, Copy, AlertTriangle, Pencil,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/authStore";
import { ServiceError } from "@/lib/types";
import type { MfaSetupResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProBadge } from "@/components/ui/pro-badge";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { usePlan } from "@/hooks/usePlan";
import { usePaystackCheckout } from "@/hooks/usePaystackCheckout";
import { SubscriptionService } from "@/services/subscription.service";
import { CheckCircle2, X, ArrowRight, Mail } from "lucide-react";
import type { BillingCycle } from "@/lib/types";

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = ["Profile", "Security", "Notifications", "Plan", "Account"] as const;
type Tab = (typeof TABS)[number];

function TabNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex border-b border-border-color mb-8 overflow-x-auto">
      {TABS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`px-5 py-[11px] text-[13.5px] font-[500] transition-colors border-b-2 -mb-px whitespace-nowrap flex-shrink-0 ${
            active === t
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  description,
  danger,
  children,
}: {
  title: string;
  description?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const borderClass = danger ? "border-[#FCCFCF]" : "border-border-color";
  return (
    <div className={`bg-surface rounded-xl mb-5 border ${borderClass}`}>
      <div className={`px-5 py-4 border-b ${borderClass}`}>
        <h2 className={`text-[14px] font-semibold ${danger ? "text-red" : "text-text-primary"}`}>
          {title}
        </h2>
        {description && (
          <p className="text-[12.5px] text-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-5 py-4">
        {children}
      </div>
    </div>
  );
}

// ── Field helpers ─────────────────────────────────────────────────────────────

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

function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
      {message}
    </p>
  );
}

function InlineSuccess({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-[12.5px] text-green bg-green-light border border-[#A0E5C6] rounded-md px-3 py-2 mb-4">
      <Check size={13} />
      {message}
    </div>
  );
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName:   z.string().min(1, "Required").max(50),
  lastName:    z.string().min(1, "Required").max(50),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9\s\-()+]+$/, "Enter a valid phone number")
    .min(7)
    .max(20)
    .or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/\d/, "Must contain a number")
      .regex(/[@$!%*?&]/, "Must contain a special character (@$!%*?&)"),
    confirmPassword: z.string().min(1, "Required"),
    mfaCode: z.string().optional(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

const zodResolver = _zodResolver as unknown as (
  schema: z.ZodTypeAny
) => Resolver<PasswordFormData>;

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab({ planData }: { planData: ReturnType<typeof usePlan>["planData"] }) {
  const user         = useAuthStore((s) => s.user);
  const setAuth      = useAuthStore((s) => s.setAuth);
  const accessToken  = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const sessionId    = useAuthStore((s) => s.sessionId);

  const profileResolver = _zodResolver as unknown as (schema: z.ZodTypeAny) => Resolver<ProfileFormData>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: profileResolver(profileSchema),
    defaultValues: {
      firstName:   user?.firstName ?? "",
      lastName:    user?.lastName  ?? "",
      phoneNumber: user?.phoneNumber ?? "",
    },
  });

  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  if (!user) return null;

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  const startEdit = () => {
    reset({
      firstName:   user.firstName,
      lastName:    user.lastName,
      phoneNumber: user.phoneNumber ?? "",
    });
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
  };

  const onSubmit = async (values: ProfileFormData) => {
    setError(null);
    try {
      const updated = await AuthService.updateMe({
        firstName:   values.firstName,
        lastName:    values.lastName,
        phoneNumber: values.phoneNumber || undefined,
      });
      if (accessToken) {
        setAuth(updated, accessToken, refreshToken ?? "", sessionId ?? "");
      }
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : "Failed to save — please try again");
    }
  };

  return (
    <Section title="Profile" description="Your personal information on Anchora.">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-border-color">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-navy to-accent flex items-center justify-center text-[18px] font-semibold text-white flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[16px] font-[600] text-text-primary">
                {user.firstName} {user.lastName}
              </p>
              {planData && (
                planData.plan === "PRO"
                  ? <ProBadge />
                  : <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">FREE</span>
              )}
            </div>
            <p className="text-[13px] text-text-tertiary">{user.email}</p>
          </div>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="flex items-center gap-1.5 text-[12.5px] text-text-secondary hover:text-accent transition-colors"
          >
            <Pencil size={13} />
            Edit
          </button>
        )}
      </div>

      {success && <InlineSuccess message="Profile updated." />}

      {!editing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.07em] mb-1">First name</p>
            <p className="text-[13.5px] text-text-primary">{user.firstName}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.07em] mb-1">Last name</p>
            <p className="text-[13.5px] text-text-primary">{user.lastName}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.07em] mb-1">Email</p>
            <div className="flex items-center gap-2">
              <p className="text-[13.5px] text-text-primary">{user.email}</p>
              <StatusBadge
                variant={user.emailVerified ? "success" : "warning"}
                label={user.emailVerified ? "Verified" : "Unverified"}
              />
            </div>
          </div>
          <div className="col-span-2">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.07em] mb-1">Phone number</p>
            <p className="text-[13.5px] text-text-primary">{user.phoneNumber ?? "—"}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} method="post" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-5">
            <div>
              <FieldLabel text="First name" required />
              <Input {...register("firstName")} />
              <FieldError message={errors.firstName?.message} />
            </div>
            <div>
              <FieldLabel text="Last name" required />
              <Input {...register("lastName")} />
              <FieldError message={errors.lastName?.message} />
            </div>
            <div className="col-span-2">
              <FieldLabel text="Email" />
              <div className="flex items-center gap-2">
                <Input value={user.email} disabled className="flex-1 opacity-60 cursor-not-allowed" />
                <StatusBadge
                  variant={user.emailVerified ? "success" : "warning"}
                  label={user.emailVerified ? "Verified" : "Unverified"}
                />
              </div>
            </div>
            <div className="col-span-2">
              <FieldLabel text="Phone number" />
              <Input placeholder="+44 7700 900000" {...register("phoneNumber")} />
              <FieldError message={errors.phoneNumber?.message} />
            </div>
          </div>

          {error && <InlineError message={error} />}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Save changes
            </Button>
            <Button type="button" variant="ghost" onClick={cancelEdit} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Section>
  );
}

// ── Change password ───────────────────────────────────────────────────────────

function PasswordSection() {
  const user     = useAuthStore((s) => s.user);
  const mfaOn    = user?.mfaEnabled ?? false;
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (values: PasswordFormData) => {
    try {
      await AuthService.changePassword({
        currentPassword: values.currentPassword,
        newPassword:     values.newPassword,
        mfaCode:         values.mfaCode || undefined,
      });
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError("root", {
        message: err instanceof ServiceError ? err.message : "Something went wrong",
      });
    }
  };

  return (
    <Section title="Change password" description="Choose a strong password you don't use elsewhere.">
      <form onSubmit={handleSubmit(onSubmit)} method="post" noValidate className="max-w-[420px]">
        <FormSection>
          <FieldLabel text="Current password" required />
          <Input type="password" placeholder="••••••••" {...register("currentPassword")} />
          <FieldError message={errors.currentPassword?.message} />
        </FormSection>

        <FormSection>
          <FieldLabel text="New password" required />
          <Input type="password" placeholder="••••••••" {...register("newPassword")} />
          <FieldError message={errors.newPassword?.message} />
        </FormSection>

        <FormSection>
          <FieldLabel text="Confirm new password" required />
          <Input type="password" placeholder="••••••••" {...register("confirmPassword")} />
          <FieldError message={errors.confirmPassword?.message} />
        </FormSection>

        {mfaOn && (
          <FormSection>
            <FieldLabel text="Authenticator code" required />
            <Input
              placeholder="000000"
              maxLength={6}
              className="max-w-[180px] text-center tracking-[0.3em] text-[18px]"
              {...register("mfaCode")}
            />
            <FieldError message={errors.mfaCode?.message} />
          </FormSection>
        )}

        {errors.root?.message && <InlineError message={errors.root.message} />}
        {success && <InlineSuccess message="Password updated successfully." />}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          Update password
        </Button>
      </form>
    </Section>
  );
}

// ── MFA ───────────────────────────────────────────────────────────────────────

type MfaPhase =
  | { phase: "idle" }
  | { phase: "setup"; data: MfaSetupResponse }
  | { phase: "enabled" }
  | { phase: "confirm_disable" };

function MfaSection() {
  const user         = useAuthStore((s) => s.user);
  const setAuth      = useAuthStore((s) => s.setAuth);
  const token        = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const sessionId    = useAuthStore((s) => s.sessionId);

  const [state, setState]     = useState<MfaPhase>({ phase: "idle" });
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);

  const mfaEnabled = user?.mfaEnabled ?? false;

  const handleStartSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AuthService.setupMfa();
      setState({ phase: "setup", data });
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : "Failed to start setup");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.trim().length < 6) return;
    setLoading(true);
    setError(null);
    try {
      await AuthService.enableMfa(code.trim());
      if (user && token) setAuth({ ...user, mfaEnabled: true }, token, refreshToken ?? "", sessionId ?? "");
      setState({ phase: "enabled" });
      setCode("");
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : "Invalid code — try again");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setError(null);
    try {
      await AuthService.disableMfa();
      if (user && token) setAuth({ ...user, mfaEnabled: false }, token, refreshToken ?? "", sessionId ?? "");
      setState({ phase: "idle" });
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : "Failed to disable MFA");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => { setState({ phase: "idle" }); setCode(""); setError(null); };

  return (
    <Section
      title="Two-factor authentication"
      description="Require a code from your authenticator app on every login."
    >
      {/* Idle */}
      {state.phase === "idle" && (
        <>
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
              mfaEnabled ? "bg-green-light" : "bg-surface-2"
            }`}>
              {mfaEnabled
                ? <ShieldCheck size={17} className="text-green" />
                : <ShieldOff size={17} className="text-text-tertiary" />}
            </div>
            <div>
              <p className="text-[13.5px] font-[500] text-text-primary">
                {mfaEnabled ? "MFA is enabled" : "MFA is disabled"}
              </p>
              <p className="text-[12px] text-text-tertiary">
                {mfaEnabled
                  ? "Your account is protected with an authenticator app."
                  : "Enable to protect your account with a time-based code."}
              </p>
            </div>
          </div>

          <InlineError message={error} />

          {mfaEnabled ? (
            <Button variant="danger" size="sm" onClick={() => setState({ phase: "confirm_disable" })}>
              Disable MFA
            </Button>
          ) : (
            <Button size="sm" onClick={handleStartSetup} disabled={loading}>
              {loading && <Loader2 size={13} className="animate-spin" />}
              Enable two-factor authentication
            </Button>
          )}
        </>
      )}

      {/* Setup — QR code */}
      {state.phase === "setup" && (
        <>
          <p className="text-[13px] text-text-secondary mb-5">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then
            enter the 6-digit code to confirm.
          </p>

          <div className="flex flex-col items-center mb-6">
            <div className="bg-white border border-border-color rounded-xl p-4 inline-block mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.data.qrCode} alt="MFA QR code" className="w-[160px] h-[160px]" />
            </div>
            <div className="flex items-center gap-2 bg-surface-2 border border-border-color rounded-lg px-3 py-2">
              <code className="text-[12px] text-text-primary tracking-widest font-mono">
                {state.data.secret}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(state.data.secret)}
                className="text-text-tertiary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer"
              >
                {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
              </button>
            </div>
            <p className="text-[11.5px] text-text-tertiary mt-1">
              Can&apos;t scan? Enter this key manually.
            </p>
          </div>

          <FormSection>
            <FieldLabel text="Verification code" required />
            <Input
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="max-w-[180px] text-center tracking-[0.3em] text-[18px]"
            />
          </FormSection>

          <InlineError message={error} />

          <div className="flex gap-3">
            <Button onClick={handleVerify} disabled={loading || code.length < 6}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              Verify & enable
            </Button>
            <Button variant="ghost" onClick={reset}>Cancel</Button>
          </div>
        </>
      )}

      {/* Just enabled */}
      {state.phase === "enabled" && (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-green-light flex items-center justify-center flex-shrink-0">
            <Check size={17} className="text-green" />
          </div>
          <div>
            <p className="text-[13.5px] font-[500] text-text-primary">
              Two-factor authentication enabled
            </p>
            <p className="text-[12px] text-text-tertiary">
              Your account is now protected. Keep your recovery codes in a safe place.
            </p>
          </div>
        </div>
      )}

      {/* Confirm disable */}
      {state.phase === "confirm_disable" && (
        <>
          <p className="text-[13px] text-text-secondary mb-4">
            Disabling MFA makes your account less secure. Are you sure you want to continue?
          </p>
          <InlineError message={error} />
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDisable} disabled={loading}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              Yes, disable MFA
            </Button>
            <Button variant="ghost" onClick={reset}>Cancel</Button>
          </div>
        </>
      )}
    </Section>
  );
}

// ── Danger zone ───────────────────────────────────────────────────────────────

function DangerZone() {
  const [modalOpen, setModalOpen]   = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const closeModal = () => { setModalOpen(false); setConfirmText(""); setError(null); };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await AuthService.deleteAccount();
      // TODO: clear auth + redirect once endpoint is finalised
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Section title="Danger zone" description="Permanent actions that cannot be undone." danger>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-[13.5px] font-[500] text-text-primary">Delete account</p>
            <p className="text-[12.5px] text-text-tertiary mt-0.5">
              Permanently deletes your account, vault, and all records.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setModalOpen(true)} className="flex-shrink-0 self-start">
            Delete account
          </Button>
        </div>
      </Section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeModal} />
          <div className="relative z-10 bg-surface rounded-2xl border border-border-color shadow-md w-full max-w-[440px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-[10px] bg-red-light flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={17} className="text-red" />
              </div>
              <h2 className="font-heading text-[20px] text-text-primary">Delete your account?</h2>
            </div>

            <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
              This will permanently delete your vault and all records. Your beneficiaries will
              lose access. <strong className="text-text-primary">This cannot be undone.</strong>
            </p>

            <FormSection>
              <FieldLabel text='Type "DELETE" to confirm' />
              <Input
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </FormSection>

            <InlineError message={error} />

            <div className="flex gap-3">
              <Button
                variant="danger"
                fullWidth
                onClick={handleDelete}
                disabled={loading || confirmText !== "DELETE"}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Delete permanently
              </Button>
              <Button variant="ghost" fullWidth onClick={closeModal} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Inactivity & Reminders ────────────────────────────────────────────────────

const INACTIVITY_OPTIONS: Array<{ value: number; label: string; recommended?: boolean }> = [
  { value: 3,  label: "3 months", recommended: true },
  { value: 6,  label: "6 months" },
  { value: 12, label: "12 months" },
  { value: 18, label: "18 months" },
];

const REMINDER_OPTIONS: Array<{ value: number; label: string; recommended?: boolean }> = [
  { value: 1, label: "Every month", recommended: true },
  { value: 3, label: "Every 3 months" },
  { value: 6, label: "Every 6 months" },
  { value: 0, label: "Never" },
];

const MONTHS_TO_DAYS: Record<number, number> = { 1: 30, 3: 90, 6: 180, 0: 0 };
const DAYS_TO_MONTHS: Record<number, number> = { 30: 1, 90: 3, 180: 6, 0: 0 };

function InactivityRemindersSection({ isFree, planLoading }: { isFree: boolean; planLoading: boolean }) {
  const user         = useAuthStore((s) => s.user);
  const setAuth      = useAuthStore((s) => s.setAuth);
  const accessToken  = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const sessionId    = useAuthStore((s) => s.sessionId);
  const addToast     = useToastStore((s) => s.add);

  const [inactivityWindow, setInactivityWindow] = useState(
    user?.inactivityWindowMonths ?? 3
  );
  const [reminderFrequency, setReminderFrequency] = useState(
    DAYS_TO_MONTHS[user?.reminderFrequencyDays ?? 30] ?? 1
  );
  const [saving, setSaving] = useState(false);

  const showCrossValidation = reminderFrequency > 0 && reminderFrequency >= inactivityWindow;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await AuthService.updateMe({
        reminderFrequencyDays: MONTHS_TO_DAYS[reminderFrequency],
        inactivityWindowMonths: inactivityWindow,
      });
      if (user && accessToken) {
        setAuth(
          {
            ...user,
            reminderFrequencyDays: updated.reminderFrequencyDays,
            inactivityWindowMonths: updated.inactivityWindowMonths,
          },
          accessToken,
          refreshToken ?? "",
          sessionId ?? "",
        );
      }
      addToast("Settings saved.", "success");
    } catch {
      addToast("Failed to save settings. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (planLoading) {
    return (
      <div>
        <div className="animate-pulse h-5 w-48 bg-surface-2 rounded mb-2" />
        <div className="animate-pulse h-3.5 w-full max-w-lg bg-surface-2 rounded mb-5" />
        <div className="bg-surface rounded-xl border border-border-color overflow-hidden">
          <div className="p-5">
            <div className="animate-pulse h-3.5 w-32 bg-surface-2 rounded mb-3" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="animate-pulse h-9 w-24 bg-surface-2 rounded-lg" />)}
            </div>
          </div>
          <div className="p-5 border-t border-border-color">
            <div className="animate-pulse h-3.5 w-36 bg-surface-2 rounded mb-3" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="animate-pulse h-9 w-28 bg-surface-2 rounded-lg" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-[14px] font-semibold text-text-primary">Inactivity &amp; Reminders</h2>
        {isFree && <ProBadge />}
      </div>
      <p className="text-sm text-text-secondary mb-4">
        If Anchora doesn&apos;t detect any activity from you within your chosen window, your executor
        will be notified to begin the estate release process. We&apos;ll send you reminders throughout
        so you can check in and reset the clock.
      </p>

      <div className={cn(
        "bg-surface rounded-xl border border-border-color overflow-hidden mb-5",
        isFree && "pointer-events-none opacity-60"
      )}>
        {/* Inactivity window */}
        <div className="p-5">
          <p className="text-[13px] font-semibold text-text-primary mb-0.5">Inactivity window</p>
          <p className="text-[12px] text-text-secondary mb-3">
            How long before your executor is notified after your last activity.
          </p>
          <div className="flex flex-wrap gap-2">
            {INACTIVITY_OPTIONS.map(({ value, label, recommended }) => (
              <button
                key={value}
                type="button"
                onClick={() => setInactivityWindow(value)}
                className={cn(
                  "px-4 py-2 border-[1.5px] rounded-lg text-[13px] font-[500] transition-all",
                  inactivityWindow === value
                    ? "border-accent bg-accent-light text-accent"
                    : "border-border-color text-text-secondary hover:border-accent hover:bg-surface-2"
                )}
              >
                {label}
                {recommended && (
                  <span className="ml-1.5 text-[11px] font-normal opacity-70">(Recommended)</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cross-validation advisory */}
        {showCrossValidation && (
          <div className="flex items-start gap-2.5 px-5 py-3 border-t border-border-color bg-amber-light">
            <AlertTriangle size={14} className="text-amber mt-[1px] flex-shrink-0" />
            <p className="text-sm text-amber leading-relaxed">
              Your reminder frequency is longer than your inactivity window. You may not receive any reminders before release is triggered.
            </p>
          </div>
        )}

        {/* Reminder frequency */}
        <div className="p-5 border-t border-border-color">
          <p className="text-[13px] font-semibold text-text-primary mb-0.5">Reminder frequency</p>
          <p className="text-[12px] text-text-secondary mb-3">
            How often Anchora reminds you to confirm your vault is up to date.
          </p>
          <div className="flex flex-wrap gap-2">
            {REMINDER_OPTIONS.map(({ value, label, recommended }) => (
              <button
                key={value}
                type="button"
                onClick={() => setReminderFrequency(value)}
                className={cn(
                  "px-4 py-2 border-[1.5px] rounded-lg text-[13px] font-[500] transition-all",
                  reminderFrequency === value
                    ? "border-accent bg-accent-light text-accent"
                    : "border-border-color text-text-secondary hover:border-accent hover:bg-surface-2"
                )}
              >
                {label}
                {recommended && (
                  <span className="ml-1.5 text-[11px] font-normal opacity-70">(Recommended)</span>
                )}
              </button>
            ))}
          </div>
          {reminderFrequency === 0 && (
            <p className="text-xs text-amber mt-2">
              You won&apos;t receive reminders before your executor is notified.
            </p>
          )}
        </div>

        {/* Save */}
        <div className="px-5 py-4 border-t border-border-color flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={15} className="animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>

      {isFree && (
        <UpgradePrompt
          feature="Configurable inactivity window"
          description="Set a custom inactivity window and reminder schedule. Available on Pro."
        />
      )}
    </div>
  );
}

// ── Plan tab ──────────────────────────────────────────────────────────────────

const ANNUAL_TOTAL = 24_000;
const ANNUAL_DISCOUNT_PCT = 20;

function PlanFeature({ included, text }: { included: boolean; text: string }) {
  return (
    <li className="flex items-start gap-2">
      {included
        ? <CheckCircle2 size={14} className="text-green flex-shrink-0 mt-[2px]" />
        : <X           size={14} className="text-text-tertiary flex-shrink-0 mt-[2px]" />}
      <span className={`text-[13px] ${included ? "text-text-primary" : "text-text-tertiary"}`}>
        {text}
      </span>
    </li>
  );
}

// Inline status view when the checkout popup has returned a result
function CheckoutStatusView({
  phase, error, onRetry, onDone,
}: {
  phase: "confirming" | "success" | "failed" | "timeout";
  error: string | null;
  onRetry: () => void;
  onDone: () => void;
}) {
  if (phase === "confirming") {
    return (
      <div className="flex flex-col items-center text-center py-16">
        <Loader2 size={32} className="animate-spin text-accent mb-4" />
        <p className="font-semibold text-[15px] text-text-primary">Confirming payment…</p>
        <p className="text-[13px] text-text-secondary mt-1">
          This only takes a moment. Please don't navigate away.
        </p>
      </div>
    );
  }
  if (phase === "success") {
    return (
      <div className="flex flex-col items-center text-center py-16">
        <div className="w-14 h-14 rounded-full bg-green/10 flex items-center justify-center mb-4">
          <CheckCircle2 size={28} className="text-green" />
        </div>
        <p className="font-heading text-[22px] text-text-primary mb-1">Welcome to Pro</p>
        <p className="text-[13px] text-text-secondary mb-6 max-w-[320px]">
          You now have unlimited records, an executor estate report, downloadable estate summary, configurable inactivity window, and priority support.
        </p>
        <Button onClick={onDone}>Go to vault</Button>
      </div>
    );
  }
  if (phase === "timeout") {
    return (
      <div className="flex flex-col items-center text-center py-16">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <Mail size={26} className="text-amber-600" />
        </div>
        <p className="font-semibold text-[15px] text-text-primary mb-1">This is taking longer than usual</p>
        <p className="text-[13px] text-text-secondary mb-5 max-w-[300px]">
          We'll send you an email once your Pro access is confirmed.
        </p>
        <Button variant="secondary" onClick={onDone}>Back to settings</Button>
      </div>
    );
  }
  // failed
  return (
    <div className="flex flex-col items-center text-center py-16">
      <p className="font-semibold text-[15px] text-text-primary mb-1">Payment didn't go through</p>
      <p className="text-[13px] text-text-secondary mb-5">
        {error ?? "No charge was made. You can try again."}
      </p>
      <div className="flex gap-3">
        <Button onClick={onRetry}>Try again</Button>
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

// 3-step cancellation modal
function CancellationModal({
  periodEndDate,
  onClose,
  onCancelled,
}: {
  periodEndDate: string | null;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addToast = useToastStore((s) => s.add);

  const reasons = ["Too expensive", "Not using it", "Missing a feature", "Other"];

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    try {
      await SubscriptionService.cancel();
      setStep(3);
      onCancelled();
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : "Something went wrong.");
      addToast("Failed to cancel subscription.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 bg-surface rounded-2xl border border-border-color shadow-md w-full max-w-[440px] p-6">
        {step === 1 && (
          <>
            <p className="font-heading text-[20px] text-text-primary mb-3">Cancel your Pro subscription?</p>
            <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
              You'll keep full Pro access until your current billing period ends
              {periodEndDate ? ` on <strong>${periodEndDate}</strong>` : ""}. After that, if you have more than 3
              asset records, records beyond the first 3 become{" "}
              <strong>read-only</strong> — you can view and delete them, but not edit, until you're back at or under the free limit.
            </p>
            {error && (
              <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={onClose}>Keep Pro</Button>
              <Button
                variant="secondary"
                fullWidth
                disabled={loading}
                onClick={() => setStep(2)}
              >
                Cancel subscription
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="font-heading text-[20px] text-text-primary mb-3">Before you go…</p>
            <p className="text-[13px] text-text-secondary mb-4">What's the main reason? (optional)</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {reasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(reason === r ? null : r)}
                  className={`px-3 py-1.5 rounded-full text-[12.5px] border transition-all ${
                    reason === r
                      ? "bg-navy text-white border-navy"
                      : "bg-surface text-text-secondary border-border-color hover:border-border-strong"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setStep(1)}>Back</Button>
              <Button
                variant="secondary"
                fullWidth
                disabled={loading}
                onClick={handleCancel}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Confirm cancellation
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex flex-col items-center text-center py-2">
              <CheckCircle2 size={32} className="text-text-secondary mb-3" />
              <p className="font-semibold text-[15px] text-text-primary mb-1">Subscription cancelled</p>
              <p className="text-[13px] text-text-secondary mb-5">
                {periodEndDate
                  ? `You'll have Pro access until ${periodEndDate}.`
                  : "Your subscription has been cancelled."}
              </p>
              <Button onClick={onClose}>Back to settings</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Billing cycle switch confirmation modal
function CycleChangeModal({
  targetCycle,
  activeCycle,
  periodEndDate,
  onClose,
  onConfirmed,
}: {
  targetCycle: BillingCycle;
  activeCycle: BillingCycle | null;
  periodEndDate: string | null;
  onClose: () => void;
  onConfirmed: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const isUpgrade = targetCycle === "ANNUAL";
  const newPrice = isUpgrade ? "₦24,000/year (₦2,000/mo)" : "₦2,500/month";
  const effectiveNote = isUpgrade
    ? "Your new annual billing starts immediately."
    : periodEndDate
      ? `Monthly billing takes effect at your next renewal on ${periodEndDate}.`
      : "Monthly billing takes effect at your next renewal.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 bg-surface rounded-2xl border border-border-color shadow-md w-full max-w-[420px] p-6">
        <p className="font-heading text-[20px] text-text-primary mb-3">
          Switch to {targetCycle === "ANNUAL" ? "annual" : "monthly"} billing
        </p>
        <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
          Your new plan will be billed at <strong>{newPrice}</strong>. {effectiveNote}
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button
            fullWidth
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await onConfirmed();
              setLoading(false);
            }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Confirm switch
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlanTab({
  planData,
  loading,
  onPlanUpdated,
}: {
  planData: ReturnType<typeof usePlan>["planData"];
  loading: boolean;
  onPlanUpdated: () => void;
}) {
  const addToast = useToastStore((s) => s.add);
  const [cycleSel, setCycleSel] = useState<BillingCycle>("MONTHLY");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [resuming, setResuming] = useState(false);

  const { start: startCheckout, phase, error: checkoutError, reset: resetCheckout } =
    usePaystackCheckout(onPlanUpdated);

  if (loading) return null;

  const isPro       = planData?.plan === "PRO";
  const isCancelled = isPro && planData?.subscriptionStatus === "CANCELLED";
  const activeCycle = planData?.billingCycle ?? null;

  const periodEndDate = planData?.currentPeriodEnd
    ? new Date(planData.currentPeriodEnd).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  // Three-state CTA for the Pro card
  const proCtaState: "upgrade" | "current" | "switch" =
    !isPro ? "upgrade" :
    activeCycle === cycleSel ? "current" : "switch";

  const handleResume = async () => {
    setResuming(true);
    try {
      await SubscriptionService.resume();
      addToast("Subscription resumed.", "success");
      onPlanUpdated();
    } catch {
      addToast("Failed to resume subscription.", "error");
    } finally {
      setResuming(false);
    }
  };

  const isInitializing = phase === "initializing" || phase === "processing";

  // Show inline status for non-idle checkout phases
  if (phase === "confirming" || phase === "success" || phase === "failed" || phase === "timeout") {
    return (
      <CheckoutStatusView
        phase={phase}
        error={checkoutError}
        onRetry={() => startCheckout(cycleSel)}
        onDone={() => { resetCheckout(); onPlanUpdated(); }}
      />
    );
  }

  return (
    <>
      {/* Current plan summary */}
      <Section title="Current plan" description="Your active Anchora subscription.">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[15px] font-semibold text-text-primary">
                {isPro ? "Pro" : "Free"}
              </p>
              {isPro && <ProBadge />}
            </div>
            <p className="text-[12.5px] text-text-secondary">
              {isPro
                ? isCancelled && periodEndDate
                  ? <span className="text-amber-600 font-medium">Cancels on {periodEndDate}</span>
                  : periodEndDate
                    ? `Renews on ${periodEndDate} · ₦${activeCycle === "ANNUAL" ? "2,000" : "2,500"}/mo · Paystack`
                    : "Active"
                : "Up to 3 asset records · all 11 categories"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isCancelled && (
              <Button size="sm" variant="secondary" disabled={resuming} onClick={handleResume}>
                {resuming && <Loader2 size={13} className="animate-spin" />}
                Resume subscription
              </Button>
            )}
            {isPro && !isCancelled && (
              <button
                type="button"
                className="text-[12.5px] text-text-secondary hover:text-text-primary underline underline-offset-2 transition-colors"
                onClick={() => setShowCancelModal(true)}
              >
                Manage billing
              </button>
            )}
            {!isPro && (
              <Button size="sm" disabled={isInitializing} onClick={() => startCheckout(cycleSel)}>
                {isInitializing ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                {isInitializing ? "Preparing…" : "Upgrade to Pro"}
              </Button>
            )}
          </div>
        </div>
      </Section>

      {/* Billing cycle toggle */}
      <div className="flex justify-center">
        <div className="flex bg-[#F3F4F6] rounded-[10px] p-[3px] gap-[2px]">
          {(["MONTHLY", "ANNUAL"] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setCycleSel(cycle)}
              className={`px-4 py-[7px] text-[13px] font-[500] rounded-[8px] transition-all flex items-center gap-2 ${
                cycleSel === cycle
                  ? "bg-surface text-text-primary shadow-sm font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {cycle === "MONTHLY" ? "Monthly" : "Annual"}
              {cycle === "ANNUAL" && (
                <span className="bg-green/15 text-green text-[11px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                  Save {ANNUAL_DISCOUNT_PCT}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Free card */}
        <div className="flex-1 bg-surface border border-border-color rounded-xl p-5">
          <span className="bg-[#F3F4F6] text-[#6B7280] text-[11.5px] font-medium px-2.5 py-1 rounded-full">
            Free
          </span>
          <p className="text-[26px] font-heading text-text-primary mt-3">₦0</p>
          <p className="text-[12px] text-text-secondary">Always free</p>
          <ul className="mt-4 space-y-2">
            <PlanFeature included text="Up to 3 asset records" />
            <PlanFeature included text="All 11 asset categories" />
            <PlanFeature included text="Designate one executor" />
            <PlanFeature included text="Inactivity monitoring" />
            <PlanFeature included={false} text="Executor receives estate report" />
            <PlanFeature included={false} text="Downloadable estate summary" />
            <PlanFeature included={false} text="Configurable inactivity window" />
            <PlanFeature included={false} text="Unlimited asset records" />
          </ul>
          {isPro ? (
            <Button variant="ghost" fullWidth className="mt-5" onClick={() => setShowCancelModal(true)}>
              Downgrade to Free
            </Button>
          ) : (
            <Button variant="secondary" fullWidth disabled className="mt-5">
              Current plan
            </Button>
          )}
        </div>

        {/* Pro card */}
        <div className="flex-1 bg-surface border-2 border-navy rounded-xl p-5">
          <div className="flex items-center gap-2">
            <span className="bg-navy text-white text-[11.5px] font-medium px-2.5 py-1 rounded-full">Pro</span>
            {cycleSel === "ANNUAL" && (
              <span className="bg-green/15 text-green text-[11px] font-semibold px-2 py-0.5 rounded-full leading-none">
                Save 20%
              </span>
            )}
          </div>
          <p className="text-[26px] font-heading text-navy mt-3">
            ₦{cycleSel === "ANNUAL" ? "2,000" : "2,500"}
          </p>
          <p className="text-[12px] text-text-secondary">
            {cycleSel === "ANNUAL"
              ? `billed ₦${ANNUAL_TOTAL.toLocaleString()}/year`
              : "per month"}
          </p>
          <ul className="mt-4 space-y-2">
            <PlanFeature included text="Unlimited asset records" />
            <PlanFeature included text="All 11 asset categories" />
            <PlanFeature included text="Designate one executor" />
            <PlanFeature included text="Full inactivity monitoring" />
            <PlanFeature included text="Executor receives estate report" />
            <PlanFeature included text="Downloadable estate summary" />
            <PlanFeature included text="Configurable inactivity window (6–24 mo)" />
            <PlanFeature included text="Priority email support" />
          </ul>
          {proCtaState === "current" ? (
            <Button fullWidth disabled className="mt-5">Current plan</Button>
          ) : (
            <Button
              fullWidth
              className="mt-5"
              disabled={isInitializing}
              onClick={
                proCtaState === "upgrade"
                  ? () => startCheckout(cycleSel)
                  : () => setShowCycleModal(true)
              }
            >
              {isInitializing ? (
                <><Loader2 size={14} className="animate-spin" /> Preparing checkout…</>
              ) : proCtaState === "upgrade" ? (
                "Upgrade to Pro"
              ) : cycleSel === "ANNUAL" ? (
                "Switch to Annual"
              ) : (
                "Switch to Monthly"
              )}
            </Button>
          )}
        </div>
      </div>

      <p className="text-[12.5px] text-text-secondary text-center mt-5">
        Questions? Contact us at hello@anchora.co
      </p>

      {showCancelModal && (
        <CancellationModal
          periodEndDate={periodEndDate}
          onClose={() => setShowCancelModal(false)}
          onCancelled={() => { setShowCancelModal(false); onPlanUpdated(); }}
        />
      )}

      {showCycleModal && (
        <CycleChangeModal
          targetCycle={cycleSel}
          activeCycle={activeCycle}
          periodEndDate={periodEndDate}
          onClose={() => setShowCycleModal(false)}
          onConfirmed={async () => {
            setShowCycleModal(false);
            await startCheckout(cycleSel);
          }}
        />
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SettingsClient({ initialTab }: { initialTab?: string }) {
  const validTab = (TABS as readonly string[]).includes(initialTab ?? "")
    ? (initialTab as Tab)
    : "Profile";
  const [tab, setTab] = useState<Tab>(validTab);
  const { planData, loading: planLoading, isFree, refetch: refetchPlan } = usePlan();

  return (
    <div className="mx-auto">
        <div className="mb-6">
          <h1 className="font-heading text-[28px] text-text-primary">Settings</h1>
          <p className="text-[13.5px] text-text-secondary mt-1">
            Manage your account, security, and preferences.
          </p>
        </div>

        <TabNav active={tab} onChange={setTab} />

        {tab === "Profile" && <ProfileTab planData={planData} />}
        {tab === "Security" && (
          <>
            <PasswordSection />
            {false && <MfaSection />}
          </>
        )}
        {tab === "Notifications" && <InactivityRemindersSection isFree={isFree} planLoading={planLoading} />}
        {tab === "Plan" && <PlanTab planData={planData} loading={planLoading} onPlanUpdated={refetchPlan} />}
        {tab === "Account" && <DangerZone />}
    </div>
  );
}
