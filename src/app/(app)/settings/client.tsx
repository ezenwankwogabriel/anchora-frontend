"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import Link from "next/link";
import { ProBadge } from "@/components/ui/pro-badge";
import { usePlan } from "@/hooks/usePlan";
import { usePaystackCheckout } from "@/hooks/usePaystackCheckout";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";
import { useNinVerification } from "@/hooks/useNinVerification";
import { CheckCircle2, X, ArrowRight, Mail } from "lucide-react";
import type { GovIdVerificationStatus, RenewalStatus } from "@/lib/types";

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = ["Profile", "Security", "Identity Verification", "Notifications", "Plan", "Account"] as const;
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
      setError(err instanceof ServiceError ? err.message : "Failed to save. Please try again.");
    }
  };

  return (
    <Section title="Profile" description="Your personal information on Anchora.">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-border-color">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-navy to-gold flex items-center justify-center text-[18px] font-semibold text-white flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[16px] font-[600] text-text-primary">
                {user.firstName} {user.lastName}
              </p>
              {planData && (
                planData.tier === "PRO"
                  ? <ProBadge />
                  : <span className="bg-surface-2 text-text-secondary text-xs font-medium px-2 py-0.5 rounded-full">FREE</span>
              )}
            </div>
            <p className="text-[13px] text-text-tertiary">{user.email}</p>
          </div>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="self-start flex items-center gap-1.5 text-[12.5px] text-text-secondary hover:text-accent transition-colors"
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
      setError(err instanceof ServiceError ? err.message : "Invalid code. Try again.");
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
              This will permanently delete your vault and all records. Your Trusted Contact will
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

function InactivityRemindersSection({ planLoading }: { planLoading: boolean }) {
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
      </div>
      <p className="text-sm text-text-secondary mb-4">
        If Anchora doesn&apos;t detect any activity from you within your chosen window, your trusted contact
        will be notified to begin the release process. We&apos;ll send you reminders throughout
        so you can check in and reset the clock.
      </p>

      <div className="bg-surface rounded-xl border border-border-color overflow-hidden mb-5">
        {/* Inactivity window */}
        <div className="p-5">
          <p className="text-[13px] font-semibold text-text-primary mb-0.5">Inactivity window</p>
          <p className="text-[12px] text-text-secondary mb-3">
            How long before your trusted contact is notified after your last activity.
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
              You won&apos;t receive reminders before your trusted contact is notified.
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
    </div>
  );
}

// ── Plan tab ──────────────────────────────────────────────────────────────────

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
  phase, error, onRetry, onDone, onGoToVault,
}: {
  phase: "confirming" | "success" | "failed" | "timeout";
  error: string | null;
  onRetry: () => void;
  onDone: () => void;
  onGoToVault: () => void;
}) {
  if (phase === "confirming") {
    return (
      <div className="flex flex-col items-center text-center py-16">
        <Loader2 size={32} className="animate-spin text-accent mb-4" />
        <p className="font-semibold text-[15px] text-text-primary">Confirming payment…</p>
        <p className="text-[13px] text-text-secondary mt-1">
          This only takes a moment. Please don&apos;t navigate away.
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
          You now have unlimited records, a downloadable release summary for you and your trusted contact, configurable inactivity window, and priority support.
        </p>
        <Button onClick={onGoToVault}>Go to vault</Button>
      </div>
    );
  }
  if (phase === "timeout") {
    return (
      <div className="flex flex-col items-center text-center py-16">
        <div className="w-14 h-14 rounded-full bg-amber-light flex items-center justify-center mb-4">
          <Mail size={26} className="text-amber" />
        </div>
        <p className="font-semibold text-[15px] text-text-primary mb-1">This is taking longer than usual</p>
        <p className="text-[13px] text-text-secondary mb-5 max-w-[300px]">
          We&apos;ll send you an email once your Pro access is confirmed.
        </p>
        <Button variant="secondary" onClick={onDone}>Back to settings</Button>
      </div>
    );
  }
  // failed
  return (
    <div className="flex flex-col items-center text-center py-16">
      <p className="font-semibold text-[15px] text-text-primary mb-1">Payment didn&apos;t go through</p>
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

// ── Identity Verification ─────────────────────────────────────────────────────

const IDENTITY_STATUS_BADGE: Record<GovIdVerificationStatus, { label: string; cls: string }> = {
  UNVERIFIED: { label: "Not verified", cls: "bg-amber-light text-amber" },
  VERIFIED:   { label: "Verified",     cls: "bg-green-light text-green" },
  FAILED:     { label: "Unsuccessful", cls: "bg-red-light text-red" },
};

function IdentityStatusBadge({ status }: { status: GovIdVerificationStatus }) {
  const { label, cls } = IDENTITY_STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function IdentityVerificationTab({
  isFree, planLoading,
}: {
  isFree: boolean;
  planLoading: boolean;
}) {
  const { identity, loading, refetch } = useIdentityStatus();
  const {
    phase, error, capturedImage, videoRef,
    startCamera, capture, retake, submit, reset,
  } = useNinVerification(refetch);
  const [nin, setNin] = useState("");

  if (loading || planLoading) return null;

  const status = identity?.status ?? "UNVERIFIED";
  const ninValid = /^\d{11}$/.test(nin);
  const inCaptureFlow =
    phase === "camera-loading" || phase === "camera-ready" ||
    phase === "captured" || phase === "submitting";

  return (
    <>
    <Section
      title="Identity Verification"
      description="A one-time identity check via NIN + selfie, using Dojah."
    >
      {status === "VERIFIED" ? (
        <p className="text-[12.5px] text-text-tertiary">
          {identity?.verifiedAt
            ? `Verified ${new Date(identity.verifiedAt).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              })}`
            : "Verified"}
        </p>
      ) : phase === "success" ? (
        <div className="flex flex-col items-center text-center py-16">
          <div className="w-14 h-14 rounded-full bg-green/10 flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-green" />
          </div>
          <p className="font-heading text-[22px] text-text-primary mb-1">Identity verified</p>
          <p className="text-[13px] text-text-secondary max-w-[320px]">
            You&apos;ll now be able to access any records released to you.
          </p>
        </div>
      ) : phase === "failed" ? (
        <div className="flex flex-col items-center text-center py-16">
          <p className="font-semibold text-[15px] text-text-primary mb-1">Verification unsuccessful</p>
          <p className="text-[13px] text-text-secondary mb-5 max-w-[320px]">
            {error ?? "We couldn't verify your identity. You can try again."}
          </p>
          <Button onClick={reset}>Try again</Button>
        </div>
      ) : inCaptureFlow ? (
        <div>
          <div className="mb-4 max-w-[280px]">
            <FieldLabel text="NIN" required />
            <Input
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="12345678901"
              disabled={phase === "submitting"}
            />
          </div>

          <div className="relative w-full max-w-[320px] aspect-[3/4] bg-black rounded-xl overflow-hidden mb-4">
            {capturedImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- ephemeral base64 selfie preview, not a static asset
              <img
                src={`data:image/jpeg;base64,${capturedImage}`}
                alt="Captured selfie"
                className="w-full h-full object-cover"
              />
            ) : (
              <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            )}
            {phase === "camera-loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 size={24} className="animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="flex gap-3 items-center">
            {phase === "camera-ready" && (
              <>
                <Button onClick={capture}>Capture selfie</Button>
                <Button variant="ghost" onClick={reset}>Cancel</Button>
              </>
            )}
            {phase === "captured" && (
              <>
                <Button onClick={() => submit(nin)} disabled={!ninValid}>
                  Submit for verification
                </Button>
                <Button variant="ghost" onClick={retake}>Retake</Button>
              </>
            )}
            {phase === "submitting" && (
              <Button disabled>
                <Loader2 size={15} className="animate-spin" />
                Verifying…
              </Button>
            )}
          </div>
          {phase === "captured" && nin.length > 0 && !ninValid && (
            <p className="text-[12px] text-red mt-2">NIN must be exactly 11 digits.</p>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13.5px] font-medium text-text-primary">Verification status</span>
            <IdentityStatusBadge status={status} />
          </div>

          <p className="text-[13px] text-text-secondary leading-relaxed mb-4 max-w-[560px]">
            Verify your identity once with your NIN and a live selfie. You&apos;ll need this before
            you can access any records that have been released to you.
          </p>

          {isFree ? (
            <Link href="/settings/upgrade">
              <Button>Upgrade to Pro to verify</Button>
            </Link>
          ) : (
            <Button onClick={startCamera}>
              {status === "FAILED" ? "Retry verification" : "Verify identity"}
            </Button>
          )}
        </div>
      )}
    </Section>
    </>
  );
}

// 3-step cancellation modal
// Inline banner shown on the Pro card when renewal needs attention.
function RenewalBanner({
  renewalStatus,
  paidUntilDate,
  onRenew,
  renewing,
}: {
  renewalStatus: RenewalStatus;
  paidUntilDate: string | null;
  onRenew: () => void;
  renewing: boolean;
}) {
  if (renewalStatus === "current" || renewalStatus === null) return null;

  const copy: Record<Exclude<RenewalStatus, "current" | null>, string> = {
    expiring_soon: paidUntilDate
      ? `Renews on ${paidUntilDate} — renew now to avoid interruption.`
      : "Your Pro access renews soon — renew now to avoid interruption.",
    auto_charge_failed:
      "Your ₦19,900 renewal didn't go through. Renew manually to keep your access.",
    expired:
      "Your paid access has lapsed. Renew now to keep your Pro features.",
  };

  const tone = renewalStatus === "expiring_soon"
    ? "bg-amber-light border-[#F0C878] text-amber"
    : "bg-red-light border-[#F5B0B0] text-red";

  return (
    <div className={`flex items-center justify-between gap-3 flex-wrap rounded-lg border px-4 py-3 mb-5 ${tone}`}>
      <p className="text-[13px] leading-snug">{copy[renewalStatus]}</p>
      <Button size="sm" disabled={renewing} onClick={onRenew}>
        {renewing && <Loader2 size={13} className="animate-spin" />}
        Renew now
      </Button>
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
  const router = useRouter();
  const [renewing, setRenewing] = useState(false);
  // Which checkout flow is in flight, so retry/onDone know which one to resume.
  const [lastIntent, setLastIntent] = useState<"checkout" | "renew">("checkout");

  const { start: startCheckout, phase, error: checkoutError, reset: resetCheckout } =
    usePaystackCheckout(onPlanUpdated);

  if (loading) return null;

  const isPro = planData?.tier === "PRO";
  const renewalStatus = planData?.renewalStatus ?? null;

  const paidUntilDate = planData?.paidUntil
    ? new Date(planData.paidUntil).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const isInitializing = phase === "initializing" || phase === "processing";

  const handleCheckout = () => { setLastIntent("checkout"); startCheckout("checkout"); };
  const handleRenew = async () => {
    setLastIntent("renew");
    setRenewing(true);
    await startCheckout("renew", planData?.paidUntil ?? null);
    setRenewing(false);
  };

  // Show inline status for non-idle checkout phases
  if (phase === "confirming" || phase === "success" || phase === "failed" || phase === "timeout") {
    return (
      <CheckoutStatusView
        phase={phase}
        error={checkoutError}
        onRetry={() => startCheckout(lastIntent, planData?.paidUntil ?? null)}
        onDone={() => { resetCheckout(); onPlanUpdated(); }}
        onGoToVault={() => { resetCheckout(); onPlanUpdated(); router.push("/vault"); }}
      />
    );
  }

  return (
    <>
      {/* Current plan summary */}
      <Section title="Current plan">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[15px] font-semibold text-text-primary">
                {isPro ? "Pro" : "Free"}
              </p>
            </div>
            <p className="text-[12.5px] text-text-secondary">
              {isPro
                ? paidUntilDate
                  ? `Renews on ${paidUntilDate} · Paystack`
                  : "Active"
                : "Up to 3 asset records · all 11 categories"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!isPro && (
              <Button size="sm" disabled={isInitializing} onClick={handleCheckout}>
                {isInitializing ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                {isInitializing ? "Preparing…" : "Upgrade to Pro"}
              </Button>
            )}
          </div>
        </div>
      </Section>

      {isPro && (
        <RenewalBanner
          renewalStatus={renewalStatus}
          paidUntilDate={paidUntilDate}
          onRenew={handleRenew}
          renewing={renewing || (isInitializing && lastIntent === "renew")}
        />
      )}

      {/* Plan cards */}
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Free card */}
        <div className="flex-1 bg-surface border border-border-color rounded-xl p-5">
          <span className="bg-surface-2 text-text-secondary text-[11.5px] font-medium px-2.5 py-1 rounded-full">
            Free
          </span>
          <p className="text-[26px] font-heading text-text-primary mt-3">₦0</p>
          <p className="text-[12px] text-text-secondary">Always free</p>
          <ul className="mt-4 space-y-2">
            <PlanFeature included text="Up to 3 asset records" />
            <PlanFeature included text="All 11 asset categories" />
            <PlanFeature included text="Designate one trusted contact" />
            <PlanFeature included text="Inactivity monitoring" />
            <PlanFeature included={false} text="Trusted contact receives release summary" />
            <PlanFeature included={false} text="Download your release summary anytime" />
            <PlanFeature included={false} text="Configurable inactivity window" />
            <PlanFeature included={false} text="Unlimited asset records" />
          </ul>
          <Button variant="secondary" fullWidth disabled className="mt-5">
            {isPro ? "Included in Pro" : "Current plan"}
          </Button>
        </div>

        {/* Pro card */}
        <div className="flex-1 bg-surface border-2 border-navy rounded-xl p-5">
          <span className="bg-navy text-white text-[11.5px] font-medium px-2.5 py-1 rounded-full">Pro</span>
          <p className="text-[26px] font-heading text-navy mt-3">₦49,900</p>
          <p className="text-[12px] text-text-secondary">one-time, then ₦19,900/year</p>
          <ul className="mt-4 space-y-2">
            <PlanFeature included text="Unlimited asset records" />
            <PlanFeature included text="All 11 asset categories" />
            <PlanFeature included text="Designate multiple trusted contacts" />
            <PlanFeature included text="Full inactivity monitoring" />
            <PlanFeature included text="Trusted contact receives release summary" />
            <PlanFeature included text="Download your release summary anytime" />
            <PlanFeature included text="Configurable inactivity window (6–24 mo)" />
            <PlanFeature included text="Priority email support" />
          </ul>
          {isPro ? (
            <Button fullWidth disabled className="mt-5">Current plan</Button>
          ) : (
            <Button
              fullWidth
              className="mt-5"
              disabled={isInitializing}
              onClick={handleCheckout}
            >
              {isInitializing ? (
                <><Loader2 size={14} className="animate-spin" /> Preparing checkout…</>
              ) : (
                "Upgrade to Pro"
              )}
            </Button>
          )}
        </div>
      </div>

      <p className="text-[12.5px] text-text-secondary text-center mt-5">
        Questions? Contact us at support@anchora.com.ng
      </p>
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
        {tab === "Identity Verification" && (
          <IdentityVerificationTab isFree={isFree} planLoading={planLoading} />
        )}
        {tab === "Notifications" && <InactivityRemindersSection planLoading={planLoading} />}
        {tab === "Plan" && <PlanTab planData={planData} loading={planLoading} onPlanUpdated={refetchPlan} />}
        {tab === "Account" && <DangerZone />}
    </div>
  );
}
