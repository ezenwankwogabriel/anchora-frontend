import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-6", className)}>
      <div>
        <h1 className="font-heading text-[24px] tracking-[-0.3px] text-text-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-text-secondary mt-[3px]">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-[10px]">{actions}</div>
      )}
    </div>
  );
}
