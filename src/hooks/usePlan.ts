import { useEffect, useState } from "react";
import { PlanService } from "@/services/plan.service";
import type { PlanData } from "@/lib/types";

export function usePlan() {
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    PlanService.get()
      .then((data) => { setPlanData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const isPro  = planData?.plan === "PRO";
  const isFree = planData?.plan === "FREE";

  return { planData, loading, isPro, isFree };
}
