import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anchora — Release Report",
};

export default function ReleaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center py-12 px-4">
      {/* Logo */}
      <div className="mb-10">
        <img
          src="/images/logo-icon-blue.png"
          alt="Anchora"
          style={{ height: "40px", width: "auto" }}
        />
      </div>

      <div className="w-full max-w-[560px]">
        {children}
      </div>
    </div>
  );
}
