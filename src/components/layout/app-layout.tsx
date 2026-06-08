import { Sidebar } from "./sidebar";
import { ProtectedRoute } from "./protected-route";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-w-[1060px]">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
