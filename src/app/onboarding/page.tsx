"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ChecklistCard, type ChecklistItem } from "@/components/ui/checklist-card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { VaultService } from "@/services/vault.service";
import { BeneficiaryService } from "@/services/beneficiary.service";
import { useAuthStore } from "@/stores/authStore";

const DISMISSED_KEY = "onboardingDismissed";

function buildChecklist(
  hasVaultRecord: boolean,
  hasBeneficiary: boolean,
  mfaEnabled: boolean
): ChecklistItem[] {
  return [
    {
      id: "vault",
      label: "Add your first financial asset",
      done: hasVaultRecord,
      href: "/vault/add",
    },
    {
      id: "beneficiary",
      label: "Add a beneficiary",
      done: hasBeneficiary,
      href: "/beneficiaries",
    },
    {
      id: "mfa",
      label: "Enable two-factor authentication",
      done: mfaEnabled,
      href: "/mfa-setup",
    },
    {
      id: "checkin",
      label: "Set up your check-in schedule",
      done: false,
      href: "/checkin",
    },
  ];
}

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<ChecklistItem[] | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) === "true") {
      router.replace("/dashboard");
      return;
    }

    async function load() {
      const [records, beneficiaries] = await Promise.allSettled([
        VaultService.getRecords(),
        BeneficiaryService.getAll(),
      ]);

      const hasVaultRecord =
        records.status === "fulfilled" && (records.value?.length ?? 0) > 0;
      const hasBeneficiary =
        beneficiaries.status === "fulfilled" &&
        (beneficiaries.value?.length ?? 0) > 0;

      setItems(buildChecklist(hasVaultRecord, hasBeneficiary, false));
    }

    load();
  }, [router]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    router.push("/dashboard");
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[560px]">
        <div className="mb-8">
          <h1 className="font-heading text-[28px] text-text-primary mb-2">
            Welcome{user ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-[14px] text-text-secondary">
            Complete these steps to get the most out of Anchora.
          </p>
        </div>

        {items === null ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-text-tertiary" />
          </div>
        ) : (
          <>
            <ChecklistCard items={items} onDismiss={dismiss} className="mb-6" />
            <div className="text-center">
              <Button variant="ghost" onClick={dismiss}>
                Skip for now
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
