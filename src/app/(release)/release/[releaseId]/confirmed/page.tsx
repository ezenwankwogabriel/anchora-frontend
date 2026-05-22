"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReleaseService } from "@/services/release.service";
import { useReleaseAuth } from "@/hooks/useReleaseAuth";
import { ServiceError } from "@/lib/types";
import type { ReleaseReport } from "@/lib/types";

export default function ReleaseConfirmedPage() {
  const params    = useParams();
  const releaseId = params.releaseId as string;
  const isAuth    = useReleaseAuth(releaseId);

  const [report, setReport]   = useState<ReleaseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchReport = () => {
    setLoading(true);
    setError(null);
    ReleaseService.getReport(releaseId)
      .then((data) => setReport(data))
      .catch((err) =>
        setError(
          err instanceof ServiceError ? err.message : "We couldn't load your report."
        )
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuth) fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, releaseId]);

  if (!isAuth) return null;

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border-color p-10 flex justify-center">
        <Loader2 size={24} className="animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-xl border border-border-color p-10 text-center">
        <p className="text-[14px] text-text-secondary mb-4">
          {error} Please try again or contact support.
        </p>
        <Button variant="secondary" onClick={fetchReport}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border-color p-8">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-14 h-14 rounded-[14px] bg-green-light flex items-center justify-center">
          <FileText size={26} className="text-green" />
        </div>
      </div>

      <h1 className="font-heading text-[28px] text-text-primary text-center mb-3 leading-tight">
        Your release report is ready
      </h1>
      <p className="text-[14px] text-text-secondary text-center leading-relaxed mb-8">
        The financial records below have been released to you.
      </p>

      {report && 'reportUrl' in report ? (
        <>
          <a href={report.reportUrl} target="_blank" rel="noreferrer" className="block">
            <Button fullWidth>
              <Download size={16} />
              Download Report
            </Button>
          </a>
          <p className="text-[11.5px] text-text-tertiary text-center mt-4 leading-relaxed">
            This link expires in 24 hours. Download and save your copy.
          </p>
        </>
      ) : (
        <div className="bg-surface-2 border border-border-color rounded-xl px-5 py-4 text-center">
          <p className="text-[13px] text-text-secondary">
            Your report is being prepared. Check back shortly or contact support if this
            persists.
          </p>
        </div>
      )}
    </div>
  );
}
