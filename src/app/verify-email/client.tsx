"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth.service";

interface Props {
  email?: string;
}

export function VerifyEmailClient({ email }: Props) {
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
