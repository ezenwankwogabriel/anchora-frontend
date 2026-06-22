"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, id, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-[22px] w-[40px] flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-accent" : "bg-gray-300"
      )}
    >
      <span
        className={cn(
          "pointer-events-none ml-[3px] inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out",
          checked ? "translate-x-[18px]" : "translate-x-0"
        )}
      />
    </button>
  );
}
