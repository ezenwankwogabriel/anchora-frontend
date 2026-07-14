import { useCallback, useEffect, useState } from "react";
import { IdentityService } from "@/services/identity.service";
import type { IdentityStatus } from "@/lib/types";

export function useIdentityStatus() {
  const [identity, setIdentity] = useState<IdentityStatus | null>(null);
  const [loading, setLoading]   = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    IdentityService.status()
      .then((data) => { setIdentity(data); setLoading(false); })
      .catch(() => {
        setIdentity((prev) => prev ?? { status: "UNVERIFIED", verifiedAt: null });
        setLoading(false);
      });
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const isVerified = identity?.status === "VERIFIED";

  return { identity, loading, isVerified, refetch };
}
