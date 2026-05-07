import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Rule {
  label: string;
  test: (v: string) => boolean;
}

const RULES: Rule[] = [
  { label: "At least 8 characters",   test: (v) => v.length >= 8 },
  { label: "One uppercase letter",     test: (v) => /[A-Z]/.test(v) },
  { label: "One number",               test: (v) => /[0-9]/.test(v) },
  { label: "One special character",    test: (v) => /[^a-zA-Z0-9]/.test(v) },
];

interface PasswordStrengthProps {
  value: string;
  className?: string;
}

export function PasswordStrength({ value, className }: PasswordStrengthProps) {
  if (!value) return null;
  return (
    <ul className={cn("flex flex-col gap-[3px] mt-2", className)}>
      {RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-[6px] text-[11.5px] transition-colors",
              ok ? "text-green" : "text-text-tertiary"
            )}
          >
            <span
              className={cn(
                "w-[14px] h-[14px] rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                ok ? "bg-green" : "bg-border-strong"
              )}
            >
              {ok && <Check size={9} strokeWidth={3} color="white" />}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
