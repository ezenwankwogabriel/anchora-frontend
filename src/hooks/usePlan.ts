import { useCallback, useEffect, useState } from "react";
import { BillingService } from "@/services/billing.service";
import type { BillingData } from "@/lib/types";

export function usePlan() {
  const [planData, setPlanData] = useState<BillingData | null>(null);
  const [loading, setLoading]   = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    BillingService.getPlan()
      .then((data) => { setPlanData(data); setLoading(false); })
      .catch(() => {
        setPlanData((prev) => prev ?? {
          tier: "FREE",
          paidUntil: null,
          renewalStatus: null,
          cardLast4: null,
        });
        setLoading(false);
      });
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const isPro  = planData?.tier === "PRO";
  const isFree = planData?.tier === "FREE";
  const needsRenewalAttention =
    isPro &&
    (planData?.renewalStatus === "auto_charge_failed" ||
      planData?.renewalStatus === "expiring_soon" ||
      planData?.renewalStatus === "expired");

  return { planData, loading, isPro, isFree, needsRenewalAttention, refetch };
}
