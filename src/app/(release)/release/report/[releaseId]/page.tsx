"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck, Clock, FileText, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReleaseService } from "@/services/release.service";
import { ServiceError } from "@/lib/types";

type PageState =
  | { phase: "loading" }
  | { phase: "success"; url: string; expiresAt: string }
  | { phase: "not_ready" }
  | { phase: "forbidden" }
  | { phase: "error" };

function formatRelativeExpiry(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins  = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `in ${hours} hour${hours !== 1 ? "s" : ""}`;
  if (mins  > 0) return `in ${mins} minute${mins !== 1 ? "s" : ""}`;
  return "soon";
}

export default function EstateReportPage() {
  const { releaseId } = useParams<{ releaseId: string }>();
  const [state, setState] = useState<PageState>({ phase: "loading" });

  useEffect(() => {
    ReleaseService.getExecutorReport(releaseId)
      .then((data) => setState({ phase: "success", url: data.url, expiresAt: data.expiresAt }))
      .catch((err) => {
        if (err instanceof ServiceError) {
          if (err.status === 403) { setState({ phase: "forbidden" }); return; }
          if (err.status === 404) { setState({ phase: "not_ready" }); return; }
        }
        setState({ phase: "error" });
      });
  }, [releaseId]);

  if (state.phase === "loading") {
    return (
      <div className="flex flex-col items-center py-16 gap-4">
        <Loader2 size={28} className="animate-spin text-text-tertiary" />
        <p className="text-[13.5px] text-text-secondary">Loading estate report...</p>
      </div>
    );
  }

  if (state.phase === "forbidden") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-[14px] text-text-primary font-medium mb-1">
          You are not authorised to view this estate report.
        </p>
        <p className="text-[13px] text-text-secondary mb-4">
          Ensure you are logged in with the correct account.
        </p>
        <Link href="/login" className="text-[13px] text-navy font-medium hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  if (state.phase === "not_ready") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-3">
        <Clock size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-[14px] text-amber-900">Report not ready yet</p>
          <p className="text-[13px] text-amber-800 mt-1">
            The estate report is being prepared. Your identity verification may still be under
            review. Check your email for updates.
          </p>
        </div>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <p className="text-[13px] text-red py-6 text-center">
        Something went wrong loading the report. Please refresh the page.
      </p>
    );
  }

  const { url, expiresAt } = state;

  return (
    <div>
      {/* Context card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-[14px] text-text-primary">Identity verified</p>
            <p className="text-[13px] text-text-secondary mt-1">
              You have been verified as the designated trusted contact for this estate.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 pl-8">
          <Clock size={14} className="text-amber-500 flex-shrink-0" />
          <p className="text-[12.5px] text-text-secondary">
            Link expires {formatRelativeExpiry(expiresAt)}
          </p>
        </div>
      </div>

      {/* Report card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-4 text-center">
        <FileText size={48} className="text-navy mx-auto" />
        <h2 className="font-heading text-xl text-text-primary mt-3">Estate report</h2>
        <p className="text-[13px] text-text-secondary mt-2 max-w-sm mx-auto">
          This document contains all registered assets and discovery guidance for each one through
          the appropriate legal and institutional channels.
        </p>
        <Button className="mt-6 px-8" onClick={() => window.open(url, "_blank")}>
          <Download size={15} />
          Download estate report
        </Button>
        <p className="text-[11.5px] text-text-tertiary mt-3">
          PDF document · Opens in a new tab
        </p>
      </div>

      {/* Guidance note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6 flex gap-3">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold text-blue-900">What to do next</p>
          <p className="text-[13px] text-blue-800 mt-1">
            Start with the Legal Foundation section of the report before approaching any institution.
            Obtaining Letters of Administration or Grant of Probate is the first step for most asset
            types.
          </p>
        </div>
      </div>
    </div>
  );
}
