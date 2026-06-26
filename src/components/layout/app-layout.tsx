"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Image from "next/image";
import { Sidebar } from "./sidebar";
import { ProtectedRoute } from "./protected-route";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-bg">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile-only top bar */}
          <header className="md:hidden sticky top-0 z-10 flex items-center gap-3 px-4 h-14 bg-surface border-b border-border-color shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <Image
              src="/images/logo-icon-blue.png"
              alt="Anchora"
              width={28}
              height={28}
              className="rounded-[6px]"
            />
            <span className="font-heading text-[16px] text-text-primary">Anchora</span>
          </header>

          <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-[1060px] w-full">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
