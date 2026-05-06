"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type BannerVariant = "success" | "warning" | "error";

interface InactivityBannerProps {
  variant: BannerVariant;
  message: React.ReactNode;
  ctaLabel: string;
  onCta?: () => void;
  className?: string;
}

const variantStyles: Record<BannerVariant, string> = {
  success: "bg-green-light border border-[#A7D7B8]",
  warning: "bg-amber-light border border-[#FCD37A]",
  error:   "bg-red-light border border-[#F5B0B0]",
};

const dotStyles: Record<BannerVariant, string> = {
  success: "bg-green shadow-[0_0_0_3px_rgba(29,122,74,0.15)]",
  warning: "bg-amber shadow-[0_0_0_3px_rgba(180,83,9,0.15)]",
  error:   "bg-red shadow-[0_0_0_3px_rgba(185,28,28,0.15)]",
};

const ctaStyles: Record<BannerVariant, string> = {
  success: "text-green bg-[rgba(29,122,74,0.10)] hover:bg-[rgba(29,122,74,0.18)]",
  warning: "text-amber bg-[rgba(180,83,9,0.10)] hover:bg-[rgba(180,83,9,0.18)]",
  error:   "text-red bg-[rgba(185,28,28,0.10)] hover:bg-[rgba(185,28,28,0.18)]",
};

export function InactivityBanner({
  variant,
  message,
  ctaLabel,
  onCta,
  className,
}: InactivityBannerProps) {
  return (
    <div
      className={cn(
        "rounded-xl px-[18px] py-3 flex items-center gap-3",
        variantStyles[variant],
        className
      )}
    >
      <span
        className={cn("w-2 h-2 rounded-full flex-shrink-0", dotStyles[variant])}
      />
      <p className="flex-1 text-[13px] text-text-primary">{message}</p>
      <button
        onClick={onCta}
        className={cn(
          "text-[12.5px] font-semibold cursor-pointer px-3 py-[6px] rounded-md border-none font-sans transition-colors whitespace-nowrap",
          ctaStyles[variant]
        )}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
