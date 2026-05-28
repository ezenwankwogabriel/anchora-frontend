"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth.service";

interface Props {
  email?: string;
  token?: string;
}

export function VerifyEmailClient({ email, token }: Props) {
  // ── Token flow (clicked link from email) ────────────────────────────
  const [verifyState, setVerifyState] = useState<"verifying" | "success" | "error" | null>(
    token ? "verifying" : null,
  );

  useEffect(() => {
    if (!token) return;
    AuthService.verifyEmail(token)
      .then(() => setVerifyState("success"))
      .catch(() => setVerifyState("error"));
  }, [token]);

  if (verifyState === "verifying") {
    return (
      <AuthCard>
        <div className="text-center">
          <Loader2 size={28} className="animate-spin text-accent mx-auto mb-4" />
          <p className="text-[14px] text-text-secondary">Verifying your email&hellip;</p>
        </div>
      </AuthCard>
    );
  }

  if (verifyState === "success") {
    return (
      <AuthCard>
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={22} className="text-green-600" />
          </div>
          <h1 className="font-heading text-[24px] text-text-primary mb-2">
            Email verified
          </h1>
          <p className="text-[13.5px] text-text-secondary leading-relaxed mb-6">
            Your email address has been confirmed. You can now sign in to your account.
          </p>
          <Button asChild fullWidth>
            <Link href="/login">Continue to login</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  if (verifyState === "error") {
    return (
      <AuthCard>
        <div className="text-center">
          <div className="w-12 h-12 bg-accent-light rounded-xl flex items-center justify-center mx-auto mb-5">
            <Mail size={22} className="text-accent" />
          </div>
          <h1 className="font-heading text-[24px] text-text-primary mb-2">
            Link expired
          </h1>
          <p className="text-[13.5px] text-text-secondary leading-relaxed mb-6">
            This verification link has expired or has already been used. Request a new one below.
          </p>
          <Button asChild fullWidth variant="secondary">
            <Link href="/verify-email">Request a new link</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  // ── No-token flow (holding screen shown after registration) ─────────
  return <HoldingScreen email={email} />;
}

function HoldingScreen({ email }: { email?: string }) {
  const [countdown, setCountdown] = useState(0);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    try {
      await AuthService.resendVerification(email);
      setSent(true);
      setCountdown(60);
    } catch {
      // silently ignore — don't reveal whether the address exists
    }
  };

  return (
    <AuthCard>
      <div className="text-center">
        <div className="w-12 h-12 bg-accent-light rounded-xl flex items-center justify-center mx-auto mb-5">
          <Mail size={22} className="text-accent" />
        </div>

        <h1 className="font-heading text-[24px] text-text-primary mb-2">
          Check your inbox
        </h1>

        <p className="text-[13.5px] text-text-secondary leading-relaxed mb-6">
          We&apos;ve sent a verification link to{" "}
          {email ? (
            <strong className="text-text-primary">{email}</strong>
          ) : (
            "your email address"
          )}
          . Click the link to activate your account.
        </p>

        {sent && (
          <p className="text-[12.5px] text-green bg-green-light border border-[#A7D7B8] rounded-md px-3 py-2 mb-4">
            Verification email resent.
          </p>
        )}

        <Button
          variant="secondary"
          fullWidth
          onClick={handleResend}
          disabled={countdown > 0}
          className="mb-4"
        >
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend email"}
        </Button>

        <p className="text-[12px] text-text-tertiary mb-4">
          The link expires in 24 hours.
        </p>

        <Link
          href="/signup"
          className="text-[13px] text-accent font-medium hover:underline"
        >
          ← Wrong email? Go back
        </Link>
      </div>
    </AuthCard>
  );
}
