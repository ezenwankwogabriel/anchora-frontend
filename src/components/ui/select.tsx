import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "w-full px-[14px] py-[10px] border-[1.5px] border-border-color rounded-md text-[14px] font-sans text-text-primary bg-surface transition-colors outline-none appearance-none cursor-pointer",
          "focus:border-accent focus:shadow-[0_0_0_3px_rgba(43,92,230,0.12)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
