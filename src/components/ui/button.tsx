import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[7px] rounded-lg text-[13.5px] font-semibold cursor-pointer border-none transition-all duration-150 ease-in-out tracking-[0.01em] select-none disabled:opacity-50 disabled:pointer-events-none [&_svg]:w-[15px] [&_svg]:h-[15px]",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white shadow-[0_1px_3px_rgba(20,27,52,0.30)] hover:bg-accent-hover hover:shadow-[0_4px_12px_rgba(20,27,52,0.30)] hover:-translate-y-px",
        secondary:
          "bg-surface text-text-primary border border-border-strong shadow-sm hover:bg-surface-2",
        ghost:
          "bg-transparent text-text-secondary border border-border-color hover:bg-surface-2 hover:text-text-primary",
        danger:
          "bg-red-light text-red border border-[#F5B0B0] hover:bg-[#FCCFCF]",
      },
      size: {
        default: "px-5 py-[10px]",
        sm: "px-3 py-[6px] text-[12.5px]",
        lg: "px-6 py-3 text-[14px]",
        icon: "w-7 h-7 p-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
