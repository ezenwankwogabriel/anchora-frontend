import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  done: boolean;
  href: string;
}

interface ChecklistCardProps {
  items: ChecklistItem[];
  onDismiss?: () => void;
  className?: string;
}

export function ChecklistCard({ items, onDismiss, className }: ChecklistCardProps) {
  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  return (
    <div className={cn("bg-surface border border-border-color rounded-xl", className)}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-color">
        <div>
          <h2 className="text-[14px] font-semibold text-text-primary">
            Getting started
          </h2>
          <p className="text-[12px] text-text-tertiary mt-[2px]">
            {doneCount} of {items.length} complete
          </p>
        </div>
        {allDone && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-[12px] text-text-tertiary hover:text-text-secondary underline"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-2">
        <div
          className="h-1 bg-accent transition-all duration-500"
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>

      <ul className="divide-y divide-border-color">
        {items.map((item) => (
          <li key={item.id}>
            {item.done ? (
              <div className="flex items-center gap-3 px-5 py-[13px]">
                <span className="w-5 h-5 rounded-full bg-green flex items-center justify-center flex-shrink-0">
                  <Check size={11} strokeWidth={2.5} className="text-white" />
                </span>
                <span className="text-[13.5px] text-text-tertiary line-through">
                  {item.label}
                </span>
              </div>
            ) : (
              <Link
                href={item.href}
                className="flex items-center gap-3 px-5 py-[13px] hover:bg-surface-2 transition-colors"
              >
                <span className="w-5 h-5 rounded-full border-2 border-border-strong flex-shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] text-text-primary font-[450]">
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="block text-[12px] text-text-tertiary mt-[2px]">
                      {item.description}
                    </span>
                  )}
                </span>
                <ChevronRight size={14} className="text-text-tertiary flex-shrink-0" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
