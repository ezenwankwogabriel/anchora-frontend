import { cn } from "@/lib/utils";

interface FormSectionProps {
  children: React.ReactNode;
  divider?: boolean;
  className?: string;
}

export function FormSection({ children, divider, className }: FormSectionProps) {
  return (
    <div className={cn(
      "mb-4",
      divider && "pt-5 mt-1 border-t border-border-color",
      className
    )}>
      {children}
    </div>
  );
}
