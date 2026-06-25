"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExecutorService } from "@/services/executor.service";

type PageState =
  | { phase: "confirm" }
  | { phase: "loading" }
  | { phase: "declined" }
  | { phase: "invalid_token" };

function DeclineContent() {
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [state, setState] = useState<PageState>(
    token ? { phase: "confirm" } : { phase: "invalid_token" }
  );

  function handleDecline() {
    setState({ phase: "loading" });
    ExecutorService.decline(token)
      .then(() => setState({ phase: "declined" }))
      .catch(() => setState({ phase: "invalid_token" }));
  }

  if (state.phase === "loading") {
    return (
      <div className="bg-surface rounded-xl border border-border-color p-10 flex justify-center">
        <Loader2 size={24} className="animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (state.phase === "confirm") {
    return (
      <div className="bg-surface rounded-xl border border-border-color p-8">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-[14px] bg-amber-light flex items-center justify-center">
            <AlertTriangle size={26} className="text-amber" />
          </div>
        </div>

        <h1 className="font-heading text-[28px] text-text-primary text-center mb-3 leading-tight">
          Decline executor invitation?
        </h1>
        <p className="text-[14px] text-text-secondary text-center leading-relaxed mb-8">
          You have been asked to act as an executor for someone&apos;s estate on Anchora. Declining
          means you will not be notified if a release is triggered, and the person who designated
          you will be notified of your decision.
        </p>

        <Button variant="danger" fullWidth onClick={handleDecline}>
          Decline invitation
        </Button>
      </div>
    );
  }

  if (state.phase === "declined") {
    return (
      <div className="bg-surface rounded-xl border border-border-color p-8">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-[14px] bg-surface-2 flex items-center justify-center">
            <CheckCircle size={26} className="text-text-tertiary" />
          </div>
        </div>

        <h1 className="font-heading text-[28px] text-text-primary text-center mb-3 leading-tight">
          Invitation declined
        </h1>
        <p className="text-[14px] text-text-secondary text-center leading-relaxed">
          You&apos;ve declined the executor invitation. The person who designated you has been
          notified and can choose to designate someone else.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border-color p-8">
      <div className="flex justify-center mb-6">
        <div className="w-14 h-14 rounded-[14px] bg-red-light flex items-center justify-center">
          <XCircle size={26} className="text-red" />
        </div>
      </div>

      <h1 className="font-heading text-[28px] text-text-primary text-center mb-3 leading-tight">
        Invalid invitation
      </h1>
      <p className="text-[14px] text-text-secondary text-center leading-relaxed">
        This invitation link is invalid or has already been used. Contact the person who designated
        you if you believe this is a mistake.
      </p>
    </div>
  );
}

export default function ExecutorDeclinePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface rounded-xl border border-border-color p-10 flex justify-center">
          <Loader2 size={24} className="animate-spin text-text-tertiary" />
        </div>
      }
    >
      <DeclineContent />
    </Suspense>
  );
}
