import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
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
  compact?: boolean;
}

function ProgressBar({ doneCount, total, rounded }: { doneCount: number; total: number; rounded?: boolean }) {
  return (
    <div className={cn("h-1 bg-surface-2", rounded && "rounded-full overflow-hidden")}>
      <div
        className="h-1 bg-accent transition-all duration-500"
        style={{ width: `${(doneCount / total) * 100}%` }}
      />
    </div>
  );
}

export function ChecklistCard({ items, onDismiss, className, compact }: ChecklistCardProps) {
  const doneCount = items.filter((i) => i.done).length;
  // The strip is only ever a space-saving default, not a dead end — a user
  // with incomplete items must still be able to reach them, so compact only
  // hides the list until they ask to see it.
  const [expanded, setExpanded] = useState(false);

  if (compact && !expanded) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(true)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setExpanded(true)}
        className={cn(
          "bg-surface border border-border-color rounded-xl px-5 py-3 cursor-pointer hover:bg-surface-2 transition-colors",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-[12.5px] font-semibold text-text-primary">
                Getting started
              </h2>
              <p className="text-[11.5px] text-text-tertiary">
                {doneCount} of {items.length} complete
              </p>
            </div>
            <ProgressBar doneCount={doneCount} total={items.length} rounded />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ChevronDown size={14} className="text-text-tertiary" />
            {onDismiss && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                  }
                }}
                aria-label="Dismiss checklist"
                className="text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-3">
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss checklist"
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <ProgressBar doneCount={doneCount} total={items.length} />

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
