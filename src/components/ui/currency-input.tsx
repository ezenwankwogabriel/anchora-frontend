import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { sanitizeNairaInput, formatNairaInputDisplay } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<InputProps, "value" | "onChange" | "type" | "size"> {
  value: string;
  onChange: (value: string) => void;
  size?: "default" | "sm";
  wrapperClassName?: string;
}

const SIZE_STYLES: Record<"default" | "sm", { input: string; prefix: string }> = {
  default: { input: "pl-[28px]", prefix: "left-[14px] text-[14px]" },
  sm: { input: "pl-[24px] py-[8px] text-[13px]", prefix: "left-[12px] text-[13px]" },
};

// ₦-prefixed text input for kobo-denominated amounts. Displays with thousand
// separators while typing (formatNairaInputDisplay) but reports back a plain
// sanitized numeric string (sanitizeNairaInput) via onChange, ready for
// parseNairaInputToKobo() at submit time.
export function CurrencyInput({
  value,
  onChange,
  size = "default",
  wrapperClassName,
  className,
  ...props
}: CurrencyInputProps) {
  const styles = SIZE_STYLES[size];
  return (
    <div className={cn("relative", wrapperClassName)}>
      <span
        className={cn(
          "absolute top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none",
          styles.prefix,
        )}
      >
        ₦
      </span>
      <Input
        type="text"
        inputMode="decimal"
        className={cn(styles.input, className)}
        value={formatNairaInputDisplay(value)}
        onChange={(e) => onChange(sanitizeNairaInput(e.target.value))}
        {...props}
      />
    </div>
  );
}
