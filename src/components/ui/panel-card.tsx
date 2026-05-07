import { cn } from "@/lib/utils";

interface PanelCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PanelCard({ title, action, children, className }: PanelCardProps) {
  return (
    <div className={cn("bg-surface border border-border-color rounded-xl", className)}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-color">
        <h2 className="text-[14px] font-semibold text-text-primary">{title}</h2>
        {action && <div>{action}</div>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
