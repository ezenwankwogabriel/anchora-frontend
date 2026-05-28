"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2, ShieldCheck, ShieldOff, Check, Copy, AlertTriangle, Pencil,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { InfoBanner } from "@/components/ui/info-banner";
import { AuthService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/authStore";
import { ServiceError } from "@/lib/types";
import type { MfaSetupResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = ["Profile", "Security", "Notifications", "Account"] as const;
type Tab = (typeof TABS)[number];

function TabNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex border-b border-border-color mb-8">
      {TABS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`px-5 py-[11px] text-[13.5px] font-[500] transition-colors border-b-2 -mb-px ${
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
  return (
    <div
      className={`bg-surface rounded-xl p-6 mb-5 ${
        danger
          ? "border border-[#FCCFCF]"
          : "border border-border-color"
      }`}
    >
      <div className="mb-5">
        <h2 className={`text-[15px] font-semibold ${danger ? "text-red" : "text-text-primary"}`}>
          {title}
        </h2>
        {description && (
          <p className="text-[13px] text-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      {children}
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

function ProfileTab() {
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
            <p className="text-[16px] font-[600] text-text-primary">
              {user.firstName} {user.lastName}
            </p>
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
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
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
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-5">
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
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-[420px]">
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
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[13.5px] font-[500] text-text-primary">Delete account</p>
            <p className="text-[12.5px] text-text-tertiary mt-0.5">
              Permanently deletes your account, vault, and all records.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setModalOpen(true)} className="flex-shrink-0">
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

// ── Notifications ─────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS: Array<{ value: number; label: string; recommended?: boolean }> = [
  { value: 30,  label: "Every month" },
  { value: 90,  label: "Every 3 months", recommended: true },
  { value: 180, label: "Every 6 months" },
  { value: 0,   label: "Never" },
];

function NotificationsSection() {
  const user         = useAuthStore((s) => s.user);
  const setAuth      = useAuthStore((s) => s.setAuth);
  const accessToken  = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const sessionId    = useAuthStore((s) => s.sessionId);

  const [frequency, setFrequency] = useState<number>(user?.reminderFrequencyDays ?? 90);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleSelect = async (value: number) => {
    const previous = frequency;
    setFrequency(value);
    setError(null);
    setSaving(true);
    try {
      const updated = await AuthService.updateMe({ reminderFrequencyDays: value });
      if (user && accessToken) {
        setAuth(
          { ...user, reminderFrequencyDays: updated.reminderFrequencyDays },
          accessToken,
          refreshToken ?? "",
          sessionId ?? "",
        );
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setFrequency(previous);
      setError(err instanceof ServiceError ? err.message : "Failed to save — please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      title="Reminder notifications"
      description="How often Anchora should remind you to confirm your vault is up to date."
    >
      <div className="flex flex-wrap gap-2 mb-4">
        {FREQUENCY_OPTIONS.map(({ value, label, recommended }) => (
          <button
            key={value}
            type="button"
            disabled={saving}
            onClick={() => handleSelect(value)}
            className={cn(
              "px-4 py-2 border-[1.5px] rounded-lg text-[13px] font-[500] transition-all disabled:opacity-60",
              frequency === value
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

      {frequency === 0 && (
        <InfoBanner variant="warning" className="mb-4">
          You&apos;ll still be notified if your vault approaches the release threshold.
        </InfoBanner>
      )}

      {error && <InlineError message={error} />}
      {saved && <InlineSuccess message="Saved" />}
    </Section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SettingsClient() {
  const [tab, setTab] = useState<Tab>("Profile");

  return (
    <AppLayout>
      <div className="max-w-[680px] mx-auto">
        <div className="mb-6">
          <h1 className="font-heading text-[28px] text-text-primary">Settings</h1>
          <p className="text-[13.5px] text-text-secondary mt-1">
            Manage your account, security, and preferences.
          </p>
        </div>

        <TabNav active={tab} onChange={setTab} />

        {tab === "Profile" && <ProfileTab />}
        {tab === "Security" && (
          <>
            <PasswordSection />
            <MfaSection />
          </>
        )}
        {tab === "Notifications" && <NotificationsSection />}
        {tab === "Account" && <DangerZone />}
      </div>
    </AppLayout>
  );
}
