import { Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type InfoBannerVariant = "info" | "warning";

interface InfoBannerProps {
  variant?: InfoBannerVariant;
  children: React.ReactNode;
  className?: string;
}

const styles: Record<InfoBannerVariant, string> = {
  info:    "bg-accent-light border border-[#B3C9FA] text-accent",
  warning: "bg-amber-light border border-[#FCD37A] text-amber",
};

export function InfoBanner({ variant = "info", children, className }: InfoBannerProps) {
  const Icon = variant === "info" ? Info : AlertTriangle;
  return (
    <div className={cn("flex items-start gap-[10px] px-4 py-3 rounded-xl", styles[variant], className)}>
      <Icon size={15} className="mt-[1px] flex-shrink-0" />
      <p className="text-[12.5px] leading-relaxed">{children}</p>
    </div>
  );
}
