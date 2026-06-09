"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Smartphone, Phone, Copy, Download, Check } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeInput } from "@/components/ui/code-input";
import { StepIndicator } from "@/components/ui/step-indicator";
import { AuthService } from "@/services/auth.service";
import { ServiceError } from "@/lib/types";
import type { MfaSetupResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

// ── Schemas ────────────────────────────────────────────────────────────────
const codeSchema = z.object({
  code: z
    .string()
    .min(6, "Enter the 6-digit code")
    .max(6, "Enter the 6-digit code"),
});

const phoneSchema = z.object({
  phone: z.string().min(7, "Enter a valid phone number"),
});

type CodeForm = z.infer<typeof codeSchema>;
type PhoneForm = z.infer<typeof phoneSchema>;

type Method = "totp" | "sms";

const MFA_TAGLINE = (
  <>
    Your vault is only as strong as its{" "}
    <em className="text-[#93B4FF] not-italic">lock.</em>
  </>
);

// ── Method selector card ───────────────────────────────────────────────────
function MethodCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-[14px] px-[18px] py-[14px] border-2 rounded-xl cursor-pointer transition-all",
        selected
          ? "border-accent bg-accent-light"
          : "border-border-color hover:border-accent"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-colors",
          selected ? "bg-accent-light [&_svg]:text-accent" : "bg-surface-2 [&_svg]:text-text-secondary"
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-[13.5px] font-semibold text-text-primary">{title}</p>
        <p className="text-[12px] text-text-tertiary mt-[2px]">{description}</p>
      </div>
    </div>
  );
}

// ── Copy button ────────────────────────────────────────────────────────────
function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 text-[11.5px] text-accent hover:underline cursor-pointer bg-transparent border-none font-sans"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : (label ?? "Copy")}
    </button>
  );
}

// ── Step 1: Setup ──────────────────────────────────────────────────────────
function SetupStep({
  onComplete,
}: {
  onComplete: (codes: string[]) => void;
}) {
  const [method, setMethod]       = useState<Method>("totp");
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [loading, setLoading]     = useState(false);

  const codeForm  = useForm<CodeForm>({ resolver: zodResolver(codeSchema) });
  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });

  const selectTotp = async () => {
    setMethod("totp");
    if (setupData) return;
    setLoading(true);
    try {
      const data = await AuthService.setupMfa();
      setSetupData(data);
    } catch (err) {
      const msg = err instanceof ServiceError ? err.message : "Setup failed";
      codeForm.setError("root", { message: msg });
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (data: CodeForm) => {
    try {
      await AuthService.enableMfa(data.code);
      onComplete(setupData?.recoveryCodes ?? []);
    } catch (err) {
      const msg = err instanceof ServiceError ? err.message : "Invalid code";
      codeForm.setError("root", { message: msg });
    }
  };

  const submitPhone = async () => {
    // [DECISION REQUIRED] SMS setup endpoint TBD
    phoneForm.setError("root", { message: "SMS setup not yet available." });
  };

  return (
    <>
      <h1 className="font-heading text-[26px] text-text-primary mb-[6px]">
        Secure your account
      </h1>
      <p className="text-[13.5px] text-text-secondary mb-6">
        Choose how you&apos;d like to verify your identity on login.
      </p>

      <div className="flex flex-col gap-[10px] mb-6">
        <MethodCard
          selected={method === "totp"}
          onClick={selectTotp}
          icon={<Smartphone size={20} />}
          title="Authenticator app"
          description="Google Authenticator, Authy, 1Password"
        />
        <MethodCard
          selected={method === "sms"}
          onClick={() => setMethod("sms")}
          icon={<Phone size={20} />}
          title="SMS code"
          description="One-time code sent to your phone"
        />
      </div>

      {/* TOTP setup */}
      {method === "totp" && (
        <>
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 size={24} className="animate-spin text-text-tertiary" />
            </div>
          )}

          {setupData && !loading && (
            <div className="mb-5">
              {/* QR code */}
              <div className="flex justify-center mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setupData.qrCode}
                  alt="MFA QR code"
                  className="w-[140px] h-[140px] border border-border-color rounded-md bg-surface-2"
                />
              </div>
              {/* Manual key */}
              <div className="bg-surface-2 border border-border-color rounded-md px-3 py-2 flex items-center justify-between mb-4">
                <code className="text-[12px] text-text-secondary tracking-wider font-mono break-all">
                  {setupData.secret}
                </code>
                <CopyButton text={setupData.secret} />
              </div>
            </div>
          )}

          <form onSubmit={codeForm.handleSubmit(submitCode)} method="post" noValidate>
            <div className="mb-5">
              <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
                Enter the 6-digit code from your app to confirm setup
              </label>
              <CodeInput placeholder="000000" {...codeForm.register("code")} />
              {codeForm.formState.errors.code && (
                <p className="text-[11.5px] text-red mt-[5px]">
                  {codeForm.formState.errors.code.message}
                </p>
              )}
            </div>

            {codeForm.formState.errors.root && (
              <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
                {codeForm.formState.errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={codeForm.formState.isSubmitting || loading}
            >
              {codeForm.formState.isSubmitting && (
                <Loader2 size={15} className="animate-spin" />
              )}
              Confirm setup →
            </Button>
          </form>
        </>
      )}

      {/* SMS setup */}
      {method === "sms" && (
        <form onSubmit={phoneForm.handleSubmit(submitPhone)} method="post" noValidate>
          <div className="mb-5">
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
              Phone number
            </label>
            <Input placeholder="+234 800 000 0000" {...phoneForm.register("phone")} />
            {phoneForm.formState.errors.phone && (
              <p className="text-[11.5px] text-red mt-[5px]">
                {phoneForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          {phoneForm.formState.errors.root && (
            <p className="text-[12.5px] text-amber bg-amber-light border border-[#FCD37A] rounded-md px-3 py-2 mb-4">
              {phoneForm.formState.errors.root.message}
            </p>
          )}

          <Button type="submit" fullWidth disabled={phoneForm.formState.isSubmitting}>
            {phoneForm.formState.isSubmitting && (
              <Loader2 size={15} className="animate-spin" />
            )}
            Send verification code →
          </Button>
        </form>
      )}
    </>
  );
}

// ── Step 2: Recovery codes ─────────────────────────────────────────────────
function RecoveryStep({ codes }: { codes: string[] }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const displayCodes = codes.length
    ? codes
    : Array.from({ length: 8 }, (_, i) => `XXXX-XXXX-${String(i).padStart(2, "0")}`);

  const download = () => {
    const content = `Anchora MFA Recovery Codes\n\n${displayCodes.join("\n")}\n\nStore these somewhere safe. Each code can only be used once.`;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "anchora-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <h1 className="font-heading text-[26px] text-text-primary mb-[6px]">
        Save your recovery codes
      </h1>
      <p className="text-[13.5px] text-text-secondary mb-5">
        These are the only way to regain access if you lose your authenticator.
        Store them somewhere safe.
      </p>

      {/* Codes grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {displayCodes.map((code, i) => (
          <div
            key={i}
            className="bg-surface-2 border border-border-color rounded-md px-3 py-2 font-mono text-[13px] text-center tracking-widest text-text-primary"
          >
            {code}
          </div>
        ))}
      </div>

      <Button
        variant="secondary"
        fullWidth
        onClick={download}
        className="mb-5"
      >
        <Download size={14} />
        Download codes as .txt
      </Button>

      <label className="flex items-start gap-2 text-[12.5px] text-text-secondary cursor-pointer mb-5">
        <input
          type="checkbox"
          className="mt-[2px] flex-shrink-0 accent-accent"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
        />
        I have saved these codes somewhere safe
      </label>

      <Button
        fullWidth
        disabled={!saved}
        onClick={() => router.push("/dashboard")}
      >
        Enable MFA and go to vault →
      </Button>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function MfaSetupPage() {
  const [step, setStep]         = useState(0);
  const [recoveryCodes, setCodes] = useState<string[]>([]);

  const handleSetupComplete = (codes: string[]) => {
    setCodes(codes);
    setStep(1);
  };

  return (
    <ProtectedRoute>
      <AuthLayout
        tagline={MFA_TAGLINE}
        subtext="Multi-factor authentication ensures only you can access your vault. This is mandatory for all accounts."
        trustItems={[]}
        footerNote="Recovery codes are the only way to regain access if you lose your authenticator. Store them somewhere safe."
      >
        <StepIndicator steps={2} current={step} className="mb-6" />

        {step === 0 ? (
          <SetupStep onComplete={handleSetupComplete} />
        ) : (
          <RecoveryStep codes={recoveryCodes} />
        )}
      </AuthLayout>
    </ProtectedRoute>
  );
}
