"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { GuardianService } from "@/services/guardian.service";

type State = "loading" | "prompt" | "accepted" | "declined" | "error";

interface Props {
  token?: string;
  action?: string;
  next?: string;
}

export function GuardianInviteClient({ token, action, next }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>(action ? "loading" : "prompt");
  const [submitting, setSubmitting] = useState(false);

  const afterAccept = () => {
    if (next) {
      router.replace(next);
    } else {
      setState("accepted");
    }
  };

  useEffect(() => {
    if (!token || !action) return;

    const run = async () => {
      try {
        if (action === "accept") {
          await GuardianService.acceptInvite(token);
          afterAccept();
        } else if (action === "decline") {
          await GuardianService.declineInvite(token);
          setState("declined");
        } else {
          setState("prompt");
        }
      } catch {
        setState("error");
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, action]);

  const handleAccept = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await GuardianService.acceptInvite(token);
      afterAccept();
    } catch {
      setState("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await GuardianService.declineInvite(token);
      setState("declined");
    } catch {
      setState("error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthCard>
        <div className="text-center">
          <p className="text-[14px] text-text-secondary">This link is invalid or has expired.</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="text-center">
        {state === "loading" && (
          <>
            <Loader2 size={28} className="animate-spin text-accent mx-auto mb-4" />
            <p className="text-[14px] text-text-secondary">Processing your response&hellip;</p>
          </>
        )}

        {state === "prompt" && (
          <>
            <div className="w-12 h-12 bg-accent-light rounded-xl flex items-center justify-center mx-auto mb-5">
              <ShieldCheck size={22} className="text-accent" />
            </div>
            <h1 className="font-heading text-[22px] text-text-primary mb-2">
              Guardian invitation
            </h1>
            <p className="text-[13.5px] text-text-secondary leading-relaxed mb-6">
              You have been invited to become a guardian for an Anchora vault.
              As a guardian, you may be asked to confirm vault releases.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleAccept} disabled={submitting}>
                {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                Accept
              </Button>
              <Button variant="ghost" onClick={handleDecline} disabled={submitting}>
                Decline
              </Button>
            </div>
          </>
        )}

        {state === "accepted" && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-5">
              <ShieldCheck size={22} className="text-green-600" />
            </div>
            <h1 className="font-heading text-[22px] text-text-primary mb-2">
              You&apos;re confirmed
            </h1>
            <p className="text-[13.5px] text-text-secondary leading-relaxed">
              Thank you for accepting. You are now the guardian for this vault.
              The vault owner has been notified.
            </p>
          </>
        )}

        {state === "declined" && (
          <>
            <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center mx-auto mb-5 border border-border-color">
              <ShieldOff size={22} className="text-text-tertiary" />
            </div>
            <h1 className="font-heading text-[22px] text-text-primary mb-2">
              Invitation declined
            </h1>
            <p className="text-[13.5px] text-text-secondary leading-relaxed">
              You have declined. The vault owner has been notified and can assign a new guardian.
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <p className="text-[14px] text-red mb-2">Something went wrong.</p>
            <p className="text-[13px] text-text-secondary">
              This link may have already been used or may have expired. Please contact the vault owner.
            </p>
          </>
        )}
      </div>
    </AuthCard>
  );
}
