"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Archive,
  Shield,
  Users,
  Settings,
  LogOut,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useEstatesStore } from "@/stores/estatesStore";
import { AuthService } from "@/services/auth.service";

const navItems = [
  { label: "Dashboard",  href: "/dashboard",  icon: LayoutDashboard, dot: false },
  { label: "Vault",      href: "/vault",       icon: Archive,         dot: false },
  { label: "Executor",   href: "/executor",    icon: Shield,          dot: false },
  { label: "Estates",    href: "/estates",     icon: Users,           dot: true  },
  { label: "Settings",   href: "/settings",    icon: Settings,        dot: false },
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

function UserCard({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [loggingOut, setLoggingOut] = useState(false);
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "";

  const handleLogout = async () => {
    onClose();
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const hasAttentionRequired = useEstatesStore((s) => s.hasAttentionRequired);
  const fetchEstates = useEstatesStore((s) => s.fetchEstates);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchEstates();
    }
  }, [isAuthenticated, fetchEstates]);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <aside className={cn(
      "w-[240px] flex-shrink-0 bg-surface border-r border-border-color flex flex-col py-6",
      "fixed inset-y-0 left-0 z-30 transition-transform duration-200",
      "md:relative md:translate-x-0 md:z-auto md:min-h-screen",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 pb-6 border-b border-border-color mb-2">
        <div className="flex items-center gap-[10px]">
          <LogoMark />
          <span className="font-heading text-[18px] text-text-primary">Anchora</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-1">
        <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-text-tertiary px-2 pt-3 pb-[5px]">
          Menu
        </p>
        {navItems.map(({ label, href, icon: Icon, dot }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-[10px] px-3 py-2 rounded-md cursor-pointer text-[13.5px] font-[450] transition-all duration-150 mb-0.5",
              isActive(href)
                ? "bg-accent-light text-accent font-[600] [&_svg]:opacity-100"
                : "text-text-secondary hover:bg-surface-2 hover:text-text-primary [&_svg]:opacity-70"
            )}
          >
            <span className="relative flex-shrink-0">
              <Icon size={17} />
              {dot && hasAttentionRequired && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </span>
            {label}
          </Link>
        ))}

      </nav>

      <UserCard onClose={onClose} />
    </aside>
  );
}
