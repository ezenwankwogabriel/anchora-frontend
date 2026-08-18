import { cn } from "@/lib/utils";

type HealthStatus = "good" | "warning" | "critical" | "empty";

interface HealthCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  status?: HealthStatus;
  icon?: React.ReactNode;
  className?: string;
}

const statusStyles: Record<HealthStatus, string> = {
  good:     "text-green",
  warning:  "text-amber",
  critical: "text-red",
  empty:    "text-text-tertiary",
};

export function HealthCard({ label, value, subtext, status = "empty", icon, className }: HealthCardProps) {
  return (
    <div className={cn(
      "bg-surface border border-border-color rounded-xl p-5 flex flex-col gap-1 shadow-sm",
      className
    )}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">
          {label}
        </p>
        {icon && <span className="text-text-tertiary">{icon}</span>}
      </div>
      <p className={cn("text-[28px] font-heading leading-none", statusStyles[status])}>
        {value}
      </p>
      {subtext && (
        <p className="text-[12px] text-text-tertiary mt-1">{subtext}</p>
      )}
    </div>
  );
}
