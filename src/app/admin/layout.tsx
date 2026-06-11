"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Users, FileText, ClipboardList, Shield, FlaskConical, LogOut } from "lucide-react";
import { useAdminAuthStore } from "@/stores/adminAuthStore";

const DEV_TOOLS_ENABLED = process.env.NEXT_PUBLIC_DEV_TOOLS === "true";

const NAV_ITEMS = [
  { href: "/admin/users",      label: "Users",          icon: Users },
  { href: "/admin/releases",   label: "Releases",       icon: FileText },
  { href: "/admin/audit-logs", label: "Audit Logs",     icon: ClipboardList },
  { href: "/admin/admins",     label: "Admin Accounts", icon: Shield,       superAdminOnly: true },
  { href: "/admin/dev-tools",  label: "Dev Tools",      icon: FlaskConical, devOnly: true },
];

function AdminSidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const admin     = useAdminAuthStore((s) => s.admin);
  const clearAuth = useAdminAuthStore((s) => s.clearAuth);

  const handleLogout = () => {
    clearAuth();
    router.replace("/admin/login");
  };

  const visibleNav = NAV_ITEMS.filter(
    (item) =>
      (!item.superAdminOnly || admin?.role === "SUPER_ADMIN") &&
      (!item.devOnly || DEV_TOOLS_ENABLED)
  );

  return (
    <aside className="w-56 bg-[#0f1a2e] flex flex-col flex-shrink-0">
      <div className="px-5 py-5 border-b border-white/10">
        <span className="font-heading text-[17px] text-white tracking-tight">
          Anchora <span className="text-[#6b9fff] font-normal">Admin</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-[500] transition-colors ${
                active
                  ? "bg-[#1e3a5f] text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5 border-t border-white/10 pt-4">
        <div className="px-3 mb-3">
          <p className="text-[12px] text-white/40 truncate">{admin?.email}</p>
          <p className="text-[11px] text-white/30">{admin?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function AdminTopBar() {
  const pathname = usePathname();
  const crumb    = pathname.split("/").filter(Boolean).slice(1).join(" › ") || "Dashboard";

  return (
    <header className="h-14 border-b border-border-color bg-surface flex items-center px-6 flex-shrink-0">
      <p className="text-[13.5px] font-[500] text-text-secondary capitalize">{crumb}</p>
    </header>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-bg overflow-y-auto">
        <AdminTopBar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
