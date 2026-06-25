"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExecutorService } from "@/services/executor.service";

type PageState =
  | { phase: "loading" }
  | { phase: "linked" }
  | { phase: "invalid_token" };

function AcceptContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token") ?? "";

  const [state, setState] = useState<PageState>({ phase: "loading" });
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!token) {
      setState({ phase: "invalid_token" });
      return;
    }

    ExecutorService.accept(token)
      .then((res) => {
        if ((res.status === "LOGIN_REQUIRED" || res.status === "SIGNUP_REQUIRED") && res.redirectUrl) {
          router.replace(res.redirectUrl);
        } else {
          setState({ phase: "linked" });
        }
      })
      .catch(() => setState({ phase: "invalid_token" }));
  }, [token, router]);

  if (state.phase === "loading") {
    return (
      <div className="bg-surface rounded-xl border border-border-color p-10 flex justify-center">
        <Loader2 size={24} className="animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (state.phase === "linked") {
    return (
      <div className="bg-surface rounded-xl border border-border-color p-8">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-[14px] bg-green-light flex items-center justify-center">
            <ShieldCheck size={26} className="text-green" />
          </div>
        </div>

        <h1 className="font-heading text-[28px] text-text-primary text-center mb-3 leading-tight">
          You&apos;re all set
        </h1>
        <p className="text-[14px] text-text-secondary text-center leading-relaxed mb-8">
          Your account has been linked as executor. You will receive a notification if an estate
          release is triggered.
        </p>

        <Link href="/dashboard">
          <Button fullWidth>Go to your account</Button>
        </Link>
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
        you and ask them to resend the invitation.
      </p>
    </div>
  );
}

export default function ExecutorAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface rounded-xl border border-border-color p-10 flex justify-center">
          <Loader2 size={24} className="animate-spin text-text-tertiary" />
        </div>
      }
    >
      <AcceptContent />
    </Suspense>
  );
}
