import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-[5px] text-[11.5px] font-[550] px-[9px] py-[3px] rounded-full",
  {
    variants: {
      variant: {
        success: "bg-green-light text-green",
        warning: "bg-amber-light text-amber",
        error:   "bg-red-light text-red",
        info:    "bg-accent-light text-accent",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const dotColors: Record<string, string> = {
  success: "bg-green",
  warning: "bg-amber",
  error:   "bg-red",
  info:    "bg-accent",
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  label: string;
}

function StatusBadge({ className, variant, label, ...props }: StatusBadgeProps) {
  const v = variant ?? "info";
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      <span
        className={cn("w-[5px] h-[5px] rounded-full", dotColors[v])}
      />
      {label}
    </span>
  );
}

export { StatusBadge };
