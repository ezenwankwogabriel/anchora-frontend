import { cn } from "@/lib/utils";

interface PanelCardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PanelCard({ title, action, children, className }: PanelCardProps) {
  const hasHeader = title || action;
  return (
    <div className={cn("bg-surface border border-border-color rounded-xl shadow-sm", className)}>
      {hasHeader && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-color">
          {title && <h2 className="text-[14px] font-semibold text-text-primary">{title}</h2>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
