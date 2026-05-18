"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

// Redirects unauthenticated users to the release login/register screen.
// Used on Screens 3 (verify) and 4 (confirmed) in the release flow.
export function useReleaseAuth(releaseId: string) {
  const router          = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      // → /release/[releaseId]/auth  (login + register screen)
      router.replace(`/release/${releaseId}/auth`);
    }
  }, [isAuthenticated, releaseId, router]);

  return isAuthenticated;
}
