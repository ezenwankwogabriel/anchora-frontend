"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/authStore";

function OAuthCallback() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const setAuth      = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const accessToken  = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const sessionId    = searchParams.get("sessionId");
    const error        = searchParams.get("error");

    if (error || !accessToken || !refreshToken || !sessionId) {
      router.replace("/login?error=oauth_failed");
      return;
    }

    AuthService.getMe(accessToken)
      .then((user) => {
        setAuth(user, accessToken, refreshToken, sessionId);
        const dest = localStorage.getItem("onboardingCompleted") ? "/dashboard" : "/onboarding";
        router.replace(dest);
      })
      .catch(() => {
        router.replace("/login?error=oauth_failed");
      });
  }, [searchParams, setAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 size={28} className="animate-spin text-text-tertiary" />
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 size={28} className="animate-spin text-text-tertiary" />
        </div>
      }
    >
      <OAuthCallback />
    </Suspense>
  );
}
