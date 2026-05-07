import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  value: string;
  max: number;
  className?: string;
}

export function CharacterCounter({ value, max, className }: CharacterCounterProps) {
  const count = value.length;
  const near  = count >= max * 0.9;
  const over  = count > max;
  return (
    <p className={cn(
      "text-[11px] text-right mt-[4px]",
      over ? "text-red" : near ? "text-amber" : "text-text-tertiary",
      className
    )}>
      {count}/{max}
    </p>
  );
}
