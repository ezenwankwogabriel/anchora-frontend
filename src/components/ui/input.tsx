import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full px-[14px] py-[10px] border-[1.5px] border-border-color rounded-md text-[14px] font-sans text-text-primary bg-surface transition-colors outline-none placeholder:text-text-tertiary",
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
Input.displayName = "Input";

export { Input };
