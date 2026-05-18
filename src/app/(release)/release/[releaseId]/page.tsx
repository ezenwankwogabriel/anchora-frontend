"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReleaseService } from "@/services/release.service";
import { useAuthStore } from "@/stores/authStore";
import type { ReleaseReport } from "@/lib/types";

export default function ReleaseLandingPage() {
  const params    = useParams();
  const router    = useRouter();
  const releaseId = params.releaseId as string;

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [report, setReport]   = useState<ReleaseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/release/${releaseId}/auth`);
      return;
    }

    ReleaseService.getReport(releaseId)
      .then((data) => setReport(data))
      .catch(() => setError("This link is no longer valid. Contact support."))
      .finally(() => setLoading(false));
  }, [isAuthenticated, releaseId, router]);

  // Waiting for auth check or report fetch
  if (!isAuthenticated || loading) {
    return (
      <div className="bg-surface rounded-xl border border-border-color p-10 flex justify-center">
        <Loader2 size={24} className="animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-xl border border-border-color p-10 text-center">
        <p className="text-[14px] text-text-secondary mb-2">{error}</p>
        <p className="text-[12.5px] text-text-tertiary">
          If you believe this is a mistake, please contact{" "}
          <a href="mailto:support@anchora.co.uk" className="text-accent hover:underline">
            support@anchora.co.uk
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border-color p-8">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-14 h-14 rounded-[14px] bg-accent-light flex items-center justify-center">
          <ShieldCheck size={26} className="text-accent" />
        </div>
      </div>

      <h1 className="font-heading text-[28px] text-text-primary text-center mb-3 leading-tight">
        You&apos;ve been named as a beneficiary
      </h1>

      <p className="text-[14px] text-text-secondary text-center leading-relaxed mb-8">
        {report?.ownerFirstName
          ? <><strong className="text-text-primary">{report.ownerFirstName}</strong>&apos;s financial records are being released to you.</>
          : "The account owner's financial records are being released to you."
        }{" "}
        To access the report you will first need to verify your identity.
      </p>

      <Button fullWidth onClick={() => router.push(`/release/${releaseId}/verify`)}>
        Verify My Identity →
      </Button>
    </div>
  );
}
