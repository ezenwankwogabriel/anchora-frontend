import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "w-full px-[14px] py-[10px] border-[1.5px] border-border-color rounded-md text-[14px] font-sans text-text-primary bg-surface transition-colors outline-none placeholder:text-text-tertiary resize-vertical min-h-[80px]",
          "focus:border-accent focus:shadow-[0_0_0_3px_rgba(20,27,52,0.12)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
