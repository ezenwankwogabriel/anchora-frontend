"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { ExecutorService } from "@/services/executor.service";

type PageState =
  | { phase: "loading" }
  | { phase: "verified" }
  | { phase: "invalid_token" };

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<PageState>({ phase: "loading" });
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!token) {
      setState({ phase: "invalid_token" });
      return;
    }

    ExecutorService.verifyEmail(token)
      .then(() => setState({ phase: "verified" }))
      .catch(() => setState({ phase: "invalid_token" }));
  }, [token]);

  if (state.phase === "loading") {
    return (
      <div className="bg-surface rounded-xl border border-border-color p-10 flex justify-center">
        <Loader2 size={24} className="animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (state.phase === "verified") {
    return (
      <div className="bg-surface rounded-xl border border-border-color p-8">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-[14px] bg-green-light flex items-center justify-center">
            <CheckCircle2 size={26} className="text-green" />
          </div>
        </div>

        <h1 className="font-heading text-[28px] text-text-primary text-center mb-3 leading-tight">
          Email confirmed
        </h1>
        <p className="text-[14px] text-text-secondary text-center leading-relaxed">
          Thanks for confirming your email address. No account or sign-up was needed — this only
          confirms the address is reachable.
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
        Invalid or expired link
      </h1>
      <p className="text-[14px] text-text-secondary text-center leading-relaxed">
        This verification link is invalid or has expired. Contact the person who designated you
        and ask them to resend the verification email.
      </p>
    </div>
  );
}

export default function ExecutorVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface rounded-xl border border-border-color p-10 flex justify-center">
          <Loader2 size={24} className="animate-spin text-text-tertiary" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
