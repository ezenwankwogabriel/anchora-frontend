import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anchora — Release Report",
};

export default function ReleaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center py-12 px-4">
      {/* Logo */}
      <div className="flex items-center gap-[10px] mb-10">
        <div className="w-[34px] h-[34px] bg-gradient-to-br from-navy to-accent rounded-[9px] flex items-center justify-center shadow-[0_2px_8px_rgba(43,92,230,0.25)]">
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
        <span className="font-heading text-[20px] text-text-primary">Anchora</span>
      </div>

      <div className="w-full max-w-[560px]">
        {children}
      </div>
    </div>
  );
}
