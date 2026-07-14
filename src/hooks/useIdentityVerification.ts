import { useCallback, useRef, useState } from "react";
import QoreID from "@qore-id/web-sdk";
import { IdentityService } from "@/services/identity.service";
import { useAuthStore } from "@/stores/authStore";
import { ServiceError } from "@/lib/types";

export type IdentityCheckoutPhase =
  | "idle"
  | "initializing"
  | "processing"
  | "confirming"
  | "success"
  | "failed"
  | "timeout";

const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_ATTEMPTS = 20; // 40 s total

export function useIdentityVerification(onSuccess?: () => void) {
  const [phase, setPhase] = useState<IdentityCheckoutPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const loadingHandlerRef = useRef<(isLoading: boolean) => void>();

  const pollForConfirmation = useCallback(async () => {
    let attempts = 0;

    const tick = async () => {
      try {
        const status = await IdentityService.status();
        if (status.status === "VERIFIED") {
          setPhase("success");
          onSuccess?.();
          return;
        }
        if (status.status === "FAILED") {
          setPhase("failed");
          setError("We were unable to verify your identity. Please try again.");
          return;
        }
      } catch {
        // swallow poll errors — keep retrying
      }

      if (++attempts < MAX_POLL_ATTEMPTS) {
        setTimeout(tick, POLL_INTERVAL_MS);
      } else {
        setPhase("timeout");
      }
    };

    await tick();
  }, [onSuccess]);

  const start = useCallback(async () => {
    if (!user) return;

    setPhase("initializing");
    setError(null);

    try {
      const { sessionToken } = await IdentityService.createSession();

      setPhase("processing");

      const handleLoading = (isLoading: boolean) => {
        if (isLoading) setPhase("processing");
      };
      loadingHandlerRef.current = handleLoading;
      QoreID.on("loading", handleLoading);

      QoreID.once("success", () => {
        QoreID.off("loading", handleLoading);
        setPhase("confirming");
        pollForConfirmation();
      });

      QoreID.once("error", () => {
        QoreID.off("loading", handleLoading);
        setPhase("failed");
        setError("Something went wrong during verification. Please try again.");
      });

      QoreID.once("close", () => {
        QoreID.off("loading", handleLoading);
        // Only reset if the widget was closed before ever reaching
        // 'success' — a completed flow has already moved on to
        // "confirming" or later by the time 'close' fires.
        setPhase((p) => (p === "processing" || p === "initializing" ? "idle" : p));
      });

      await QoreID.start({
        token: sessionToken,
        customerReference: user.id,
        applicantData: {
          firstname: user.firstName,
          lastname: user.lastName,
          email: user.email,
          phone: user.phoneNumber ?? undefined,
        },
      });
    } catch (err) {
      setPhase("failed");
      setError(
        err instanceof ServiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      );
    }
  }, [user, pollForConfirmation]);

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
  }, []);

  return { start, phase, error, reset };
}
