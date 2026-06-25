import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Anchora",
};

export default function ReleaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center px-4 py-12">
      <div className="mb-10">
        <Image
          src="/images/logo-full-blue.png"
          alt="Anchora"
          width={120}
          height={36}
          priority
        />
      </div>

      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}
