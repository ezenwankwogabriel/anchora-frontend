import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

function LogoMark() {
  return (
    <div className="flex justify-center mb-5">
      <img
        src="/images/logo-icon-blue.png"
        alt="Anchora"
        style={{ height: "36px", width: "auto" }}
      />
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
