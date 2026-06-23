"use client";

import { Suspense, useEffect, useState } from "react";
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

  useEffect(() => {
    if (!token) {
      setState({ phase: "invalid_token" });
      return;
    }

    ExecutorService.accept(token)
      .then((res) => {
        if (res.status === "SIGNUP_REQUIRED" && res.redirectUrl) {
          router.replace(res.redirectUrl);
        } else {
          setState({ phase: "linked" });
        }
      })
      .catch(() => setState({ phase: "invalid_token" }));
  }, [token, router]);

  if (state.phase === "loading") {
    return (
      <div className="flex flex-col items-center py-16 gap-4">
        <Loader2 size={28} className="animate-spin text-text-tertiary" />
        <p className="text-[13.5px] text-text-secondary">Verifying your invitation...</p>
      </div>
    );
  }

  if (state.phase === "linked") {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <ShieldCheck size={48} className="text-emerald-500 mb-5" />
        <h1 className="font-heading text-2xl text-text-primary">You&apos;re all set</h1>
        <p className="text-[13.5px] text-text-secondary mt-2 max-w-sm">
          Your account has been linked as executor. You&apos;ll receive a notification if an estate
          release is triggered.
        </p>
        <Link href="/dashboard">
          <Button className="mt-6">Go to your account</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <XCircle size={48} className="text-red-400 mb-5" />
      <h1 className="font-heading text-2xl text-text-primary">Invalid invitation</h1>
      <p className="text-[13.5px] text-text-secondary mt-2 max-w-sm">
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
        <div className="flex flex-col items-center py-16 gap-4">
          <Loader2 size={28} className="animate-spin text-text-tertiary" />
          <p className="text-[13.5px] text-text-secondary">Verifying your invitation...</p>
        </div>
      }
    >
      <AcceptContent />
    </Suspense>
  );
}
