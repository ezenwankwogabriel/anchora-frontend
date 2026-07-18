import { useCallback, useState } from "react";
import { SubscriptionService } from "@/services/subscription.service";
import { ServiceError } from "@/lib/types";
import type { BillingCycle } from "@/lib/types";

export type CheckoutPhase =
  | "idle"
  | "initializing"
  | "processing"
  | "confirming"
  | "success"
  | "failed"
  | "timeout";

interface PaystackPopInstance {
  newTransaction(opts: {
    key: string;
    accessCode: string;
    onSuccess: () => void;
    onCancel: () => void;
  }): void;
}

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopInstance;
  }
}

const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_ATTEMPTS = 20; // 40 s total

// Paystack account is still in test mode / pending verification — checkout is
// hidden behind this flag so we can onboard users on the free plan in the
// meantime. Flip NEXT_PUBLIC_ENABLE_PRO_CHECKOUT=true once verification clears.
export const PRO_CHECKOUT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PRO_CHECKOUT === "true";

export function usePaystackCheckout(onSuccess?: () => void) {
  const [phase, setPhase] = useState<CheckoutPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const pollForActivation = useCallback(async () => {
    let attempts = 0;

    const tick = async () => {
      try {
        const status = await SubscriptionService.status();
        if (status.plan === "PRO" && status.subscriptionStatus === "ACTIVE") {
          setPhase("success");
          onSuccess?.();
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

  const start = useCallback(
    async (billingCycle: BillingCycle) => {
      if (!PRO_CHECKOUT_ENABLED) {
        setPhase("failed");
        setError("Pro checkout isn't available yet. Check back soon.");
        return;
      }

      setPhase("initializing");
      setError(null);

      try {
        const { accessCode } = await SubscriptionService.initialize(billingCycle);

        const PaystackPop = window.PaystackPop;
        if (!PaystackPop) {
          throw new Error("Paystack script not yet loaded. Please refresh and try again.");
        }

        setPhase("processing");
        const popup = new PaystackPop();
        popup.newTransaction({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
          accessCode,
          onSuccess: () => {
            setPhase("confirming");
            pollForActivation();
          },
          onCancel: () => {
            setPhase("idle");
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
    },
    [pollForActivation],
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
  }, []);

  return { start, phase, error, reset };
}
