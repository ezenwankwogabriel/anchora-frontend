"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Archive,
  Users,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { AuthService } from "@/services/auth.service";

const navItems = [
  { label: "Dashboard",      href: "/dashboard",     icon: LayoutDashboard },
  { label: "Vault",          href: "/vault",          icon: Archive },
  { label: "Beneficiaries",  href: "/beneficiaries", icon: Users },
  // { label: "Check-In",       href: "/checkin",       icon: ShieldCheck },
  { label: "Settings",       href: "/settings",      icon: Settings },
];


function LogoMark() {
  return (
    <div className="w-[34px] h-[34px] bg-gradient-to-br from-navy to-accent rounded-[9px] flex items-center justify-center shadow-[0_2px_8px_rgba(43,92,230,0.25)] flex-shrink-0">
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

function UserCard() {
  const user = useAuthStore((s) => s.user);
  const [loggingOut, setLoggingOut] = useState(false);
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "";

  const handleLogout = async () => {
    setLoggingOut(true);
    await AuthService.logout();
  };

  return (
    <div className="px-5 pt-4 border-t border-border-color">
      <div className="flex items-center gap-[10px] p-2 rounded-md">
        <div className="w-8 h-8 bg-gradient-to-br from-navy to-accent rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-[550] truncate text-text-primary">
            {fullName}
          </p>
          <p className="text-[11px] text-text-tertiary truncate">
            {user?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-text-tertiary hover:text-red transition-colors flex-shrink-0 p-1 rounded"
          title="Log out"
        >
          {loggingOut
            ? <Loader2 size={14} className="animate-spin" />
            : <LogOut size={14} />}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <aside className="w-[240px] flex-shrink-0 bg-surface border-r border-border-color flex flex-col py-6 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-[10px] px-5 pb-6 border-b border-border-color mb-2">
        <LogoMark />
        <span className="font-heading text-[18px] text-text-primary">Anchora</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-1">
        <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-text-tertiary px-2 pt-3 pb-[5px]">
          Menu
        </p>
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-[10px] px-3 py-2 rounded-md cursor-pointer text-[13.5px] font-[450] transition-all duration-150 mb-0.5",
              isActive(href)
                ? "bg-accent-light text-accent font-[550] [&_svg]:opacity-100"
                : "text-text-secondary hover:bg-surface-2 hover:text-text-primary [&_svg]:opacity-70"
            )}
          >
            <Icon size={17} className="flex-shrink-0" />
            {label}
          </Link>
        ))}

      </nav>

      <UserCard />
    </aside>
  );
}
