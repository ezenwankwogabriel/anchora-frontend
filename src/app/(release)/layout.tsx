import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anchora",
};

export default function ReleaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center px-4 py-12">
      <div className="mb-10">
        <p className="font-heading text-xl font-semibold text-text-primary tracking-wide">
          ANCHORA
        </p>
      </div>

      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}
