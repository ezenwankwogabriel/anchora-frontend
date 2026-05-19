"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/stores/adminAuthStore";

export function useAdminAuth() {
  const router          = useRouter();
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const admin           = useAdminAuthStore((s) => s.admin);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, router]);

  return { isAuthenticated, admin };
}
