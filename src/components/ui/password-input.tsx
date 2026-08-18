"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    return (
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className={cn(
            "w-full px-[14px] py-[10px] pr-10 border-[1.5px] border-border-color rounded-md text-[14px] font-sans text-text-primary bg-surface transition-colors outline-none placeholder:text-text-tertiary",
            "focus:border-accent focus:shadow-[0_0_0_3px_rgba(20,27,52,0.12)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
