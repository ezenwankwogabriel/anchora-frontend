"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Archive,
  Shield,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { AuthService } from "@/services/auth.service";

const navItems = [
  { label: "Dashboard",        href: "/dashboard",     icon: LayoutDashboard },
  { label: "Vault",            href: "/vault",          icon: Archive },
  { label: "Executor",         href: "/executor",       icon: Shield },
  // { label: "Check-In",       href: "/checkin",       icon: ShieldCheck },
  { label: "Settings",         href: "/settings",       icon: Settings },
];


function LogoMark() {
  return (
    <Image
      src="/images/logo-icon-blue.png"
      alt="Anchora"
      width={48}
      height={48}
      className="rounded-[9px] flex-shrink-0"
    />
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
                ? "bg-accent-light text-accent font-[600] [&_svg]:opacity-100"
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
