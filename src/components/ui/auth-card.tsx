import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

function LogoMark() {
  return (
    <div className="w-9 h-9 bg-gradient-to-br from-navy to-accent rounded-[9px] flex items-center justify-center shadow-[0_2px_8px_rgba(43,92,230,0.25)] mx-auto mb-5">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3L4 7V12C4 16.4 7.4 20.5 12 21C16.6 20.5 20 16.4 20 12V7L12 3Z"
          fill="white"
          opacity=".9"
        />
        <path
          d="M9 12L11 14L15 10"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity=".7"
        />
      </svg>
    </div>
  );
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div
        className={cn(
          "bg-surface border border-border-color rounded-2xl shadow-md w-full max-w-[440px] p-8",
          className
        )}
      >
        <Link href="/" className="block">
          <LogoMark />
        </Link>
        {children}
      </div>
    </div>
  );
}
