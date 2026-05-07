"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { CodeInput } from "@/components/ui/code-input";
import { AuthService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/authStore";
import { ServiceError } from "@/lib/types";

// ── Schemas ────────────────────────────────────────────────────────────────
const credentialsSchema = z.object({
  email: z.email({ message: "Enter a valid email" }),
  password: z.string().min(1, "Required"),
});

const mfaCodeSchema = z.object({
  code: z
    .string()
    .min(6, "Enter the 6-digit code")
    .max(6, "Enter the 6-digit code"),
});

const recoverySchema = z.object({
  recoveryCode: z.string().min(1, "Required"),
});

type CredentialsForm = z.infer<typeof credentialsSchema>;
type MfaCodeForm = z.infer<typeof mfaCodeSchema>;
type RecoveryForm = z.infer<typeof recoverySchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11.5px] text-red mt-[5px]">{message}</p>;
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
      {message}
    </p>
  );
}

// ── Credentials step ───────────────────────────────────────────────────────
function CredentialsStep({
  onMfaRequired,
}: {
  onMfaRequired: (session: string) => void;
}) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CredentialsForm>({ resolver: zodResolver(credentialsSchema) });

  const onSubmit = async (data: CredentialsForm) => {
    try {
      const res = await AuthService.login(data);
      if (res.mfaRequired && res.mfaSession) {
        onMfaRequired(res.mfaSession);
      } else {
        setAuth(res.user, res.accessToken);
        router.push("/dashboard");
      }
    } catch (err) {
      if (err instanceof ServiceError) {
        const msg =
          err.status === 423
            ? "Your account has been temporarily locked after too many failed attempts. Try again in 15 minutes."
            : err.status === 403
            ? "Please verify your email before signing in."
            : "Incorrect email or password.";
        setError("root", { message: msg });
      }
    }
  };

  return (
    <>
      <h1 className="font-heading text-[26px] text-text-primary mb-[6px]">
        Welcome back
      </h1>
      <p className="text-[13.5px] text-text-secondary mb-7">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-accent font-medium hover:underline">
          Create one
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-4">
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
            Email address
          </label>
          <Input
            type="email"
            placeholder="olumide@gmail.com"
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="mb-2">
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
            Password
          </label>
          <PasswordInput placeholder="Your password" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>

        <div className="text-right mb-5">
          <Link
            href="/forgot-password"
            className="text-[12.5px] text-accent hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <FormError message={errors.root?.message} />

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          Sign in →
        </Button>
      </form>
    </>
  );
}

// ── MFA step ───────────────────────────────────────────────────────────────
function MfaStep({ session }: { session: string }) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [useRecovery, setUseRecovery] = useState(false);

  const codeForm = useForm<MfaCodeForm>({ resolver: zodResolver(mfaCodeSchema) });
  const recoveryForm = useForm<RecoveryForm>({ resolver: zodResolver(recoverySchema) });

  const submitCode = async (data: MfaCodeForm) => {
    try {
      const res = await AuthService.verifyMfa({ code: data.code, session });
      setAuth(res.user, res.accessToken);
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof ServiceError ? err.message : "Invalid code.";
      codeForm.setError("root", { message: msg });
    }
  };

  const submitRecovery = async (data: RecoveryForm) => {
    try {
      const res = await AuthService.verifyMfa({
        recoveryCode: data.recoveryCode,
        session,
      });
      setAuth(res.user, res.accessToken);
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof ServiceError ? err.message : "Invalid recovery code.";
      recoveryForm.setError("root", { message: msg });
    }
  };

  return (
    <>
      <h1 className="font-heading text-[26px] text-text-primary mb-[6px]">
        Enter your verification code
      </h1>
      <p className="text-[13.5px] text-text-secondary mb-7">
        {useRecovery
          ? "Enter one of your saved recovery codes."
          : "Open your authenticator app and enter the 6-digit code."}
      </p>

      {!useRecovery ? (
        <form onSubmit={codeForm.handleSubmit(submitCode)} noValidate>
          <div className="mb-5">
            <CodeInput
              placeholder="000000"
              {...codeForm.register("code")}
            />
            <FieldError message={codeForm.formState.errors.code?.message} />
          </div>
          <FormError message={codeForm.formState.errors.root?.message} />
          <Button
            type="submit"
            fullWidth
            disabled={codeForm.formState.isSubmitting}
          >
            {codeForm.formState.isSubmitting && (
              <Loader2 size={15} className="animate-spin" />
            )}
            Verify →
          </Button>
        </form>
      ) : (
        <form onSubmit={recoveryForm.handleSubmit(submitRecovery)} noValidate>
          <div className="mb-5">
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
              Recovery code
            </label>
            <Input
              placeholder="XXXX-XXXX"
              {...recoveryForm.register("recoveryCode")}
            />
            <FieldError message={recoveryForm.formState.errors.recoveryCode?.message} />
          </div>
          <FormError message={recoveryForm.formState.errors.root?.message} />
          <Button
            type="submit"
            fullWidth
            disabled={recoveryForm.formState.isSubmitting}
          >
            {recoveryForm.formState.isSubmitting && (
              <Loader2 size={15} className="animate-spin" />
            )}
            Verify →
          </Button>
        </form>
      )}

      <button
        type="button"
        onClick={() => setUseRecovery((v) => !v)}
        className="mt-4 w-full text-center text-[12.5px] text-accent hover:underline cursor-pointer bg-transparent border-none font-sans"
      >
        {useRecovery
          ? "← Use authenticator app instead"
          : "Use a recovery code instead"}
      </button>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [mfaSession, setMfaSession] = useState<string | null>(null);

  return (
    <AuthLayout>
      {mfaSession ? (
        <MfaStep session={mfaSession} />
      ) : (
        <CredentialsStep onMfaRequired={setMfaSession} />
      )}
    </AuthLayout>
  );
}
