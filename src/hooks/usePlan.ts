import { useCallback, useEffect, useState } from "react";
import { PlanService } from "@/services/plan.service";
import type { PlanData } from "@/lib/types";

export function usePlan() {
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading]   = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    PlanService.get()
      .then((data) => { setPlanData(data); setLoading(false); })
      .catch(() => {
        setPlanData((prev) => prev ?? {
          plan: "FREE",
          planActivatedAt: null,
          billingCycle: null,
          subscriptionStatus: "NONE",
          currentPeriodEnd: null,
          cancelledAt: null,
          limits: {
            maxVaultRecords: 3,
            canDownloadReport: false,
            canConfigureInactivityWindow: false,
            executorReceivesReport: false,
          },
        });
        setLoading(false);
      });
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const isPro  = planData?.plan === "PRO";
  const isFree = planData?.plan === "FREE";
  console.log('is free', planData)
  const isCancelledPro = isPro && planData?.subscriptionStatus === "CANCELLED";

  return { planData, loading, isPro, isFree, isCancelledPro, refetch };
}
