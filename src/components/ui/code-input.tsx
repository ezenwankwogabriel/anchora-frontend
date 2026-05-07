"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CodeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "maxLength"
>;

export const CodeInput = React.forwardRef<HTMLInputElement, CodeInputProps>(
  ({ className, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Strip non-digits
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
      onChange?.(e);
    };

    return (
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        onChange={handleChange}
        className={cn(
          "w-full px-[14px] py-3 border-[1.5px] border-border-color rounded-md text-[22px] font-sans font-semibold text-text-primary bg-surface tracking-[0.3em] text-center transition-colors outline-none placeholder:text-text-tertiary",
          "focus:border-accent focus:shadow-[0_0_0_3px_rgba(43,92,230,0.12)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
CodeInput.displayName = "CodeInput";
