"use client";

import Link from "next/link";
import { X, Lock, Loader2, CheckCircle2, Mail } from "lucide-react";
import { Button } from "./button";
import { usePaystackCheckout } from "@/hooks/usePaystackCheckout";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  onUpgraded?: () => void;
}

export function PaywallModal({ open, onClose, onUpgraded }: PaywallModalProps) {
  const { start, phase, error, reset } = usePaystackCheckout(onUpgraded);

  if (!open) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── Confirming state ─────────────────────────────────────────────────────────
  if (phase === "confirming") {
    return (
      <Overlay onClose={handleClose}>
        <div className="flex flex-col items-center text-center py-2">
          <Loader2 size={32} className="animate-spin text-accent mb-4" />
          <p className="font-semibold text-[15px] text-text-primary">Confirming payment…</p>
          <p className="text-[13px] text-text-secondary mt-1 max-w-[280px]">
            This only takes a moment. Please don&apos;t close this window.
          </p>
        </div>
      </Overlay>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <Overlay onClose={handleClose}>
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center mb-4">
            <CheckCircle2 size={24} className="text-green" />
          </div>
          <p className="font-heading text-[20px] text-text-primary mb-1">Welcome to Pro</p>
          <p className="text-[13px] text-text-secondary mb-5 max-w-[300px]">
            You now have unlimited records, an executor estate report, downloadable estate summary, and configurable inactivity window.
          </p>
          <Button fullWidth onClick={handleClose}>Go to vault</Button>
        </div>
      </Overlay>
    );
  }

  // ── Timeout state ─────────────────────────────────────────────────────────────
  if (phase === "timeout") {
    return (
      <Overlay onClose={handleClose}>
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Mail size={22} className="text-amber-600" />
          </div>
          <p className="font-semibold text-[15px] text-text-primary mb-1">
            This is taking longer than usual
          </p>
          <p className="text-[13px] text-text-secondary mb-5 max-w-[300px]">
            We&apos;ll send you an email once your Pro access is confirmed. You can safely close this window.
          </p>
          <Button fullWidth onClick={handleClose}>Got it</Button>
        </div>
      </Overlay>
    );
  }

  // ── Failed state ─────────────────────────────────────────────────────────────
  if (phase === "failed") {
    return (
      <Overlay onClose={handleClose}>
        <div className="flex flex-col items-center text-center py-2">
          <p className="font-semibold text-[15px] text-text-primary mb-1">
            Payment didn&apos;t go through
          </p>
          <p className="text-[13px] text-text-secondary mb-2 max-w-[300px]">
            {error ?? "No charge was made. You can try again."}
          </p>
          <div className="flex gap-3 w-full mt-3">
            <Button fullWidth onClick={() => start("MONTHLY")}>
              Try again
            </Button>
            <Button variant="ghost" fullWidth onClick={handleClose}>Cancel</Button>
          </div>
        </div>
      </Overlay>
    );
  }

  // ── Default paywall state ─────────────────────────────────────────────────────
  const isInitializing = phase === "initializing" || phase === "processing";

  return (
    <Overlay onClose={handleClose}>
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors"
      >
        <X size={18} />
      </button>

      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <Lock size={22} className="text-amber-600" />
        </div>
        <p className="font-heading text-[20px] text-text-primary mb-2">
          You&apos;ve reached your free plan limit
        </p>
        <p className="text-[13px] text-text-secondary mb-6 max-w-[300px]">
          Free plans include up to 3 asset records. Upgrade to Pro for unlimited records across all 11 categories.
        </p>

        <Button
          fullWidth
          disabled={isInitializing}
          onClick={() => start("MONTHLY")}
          className="mb-3"
        >
          {isInitializing
            ? <><Loader2 size={14} className="animate-spin" /> Preparing checkout…</>
            : "Upgrade to Pro"}
        </Button>

        <Link
          href="/settings?tab=Plan"
          className="text-[12.5px] text-text-secondary hover:text-text-primary transition-colors"
          onClick={handleClose}
        >
          View plans
        </Link>
      </div>
    </Overlay>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 bg-surface rounded-2xl border border-border-color shadow-md w-full max-w-[420px] p-6">
        {children}
      </div>
    </div>
  );
}
