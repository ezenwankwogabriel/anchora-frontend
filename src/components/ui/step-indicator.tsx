import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: number;
  current: number;
  className?: string;
}

export function StepIndicator({ steps, current, className }: StepIndicatorProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {Array.from({ length: steps }, (_, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div
            key={i}
            className={cn(
              "flex-1 h-1 rounded-full transition-colors duration-300",
              done   ? "bg-green" :
              active ? "bg-accent" :
                       "bg-border-color"
            )}
          />
        );
      })}
    </div>
  );
}
