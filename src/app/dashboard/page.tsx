"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { HealthCard } from "@/components/ui/health-card";
import { PanelCard } from "@/components/ui/panel-card";
import { ChecklistCard, type ChecklistItem } from "@/components/ui/checklist-card";
import { BeneficiaryRow } from "@/components/ui/beneficiary-row";
import { AssetCategoryRow } from "@/components/ui/asset-category-row";
import { InactivityBanner } from "@/components/ui/inactivity-banner";
import { SkeletonCard, SkeletonRow } from "@/components/ui/skeleton-card";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuthStore } from "@/stores/authStore";
import type { AssetCategory, VaultCompleteness, Beneficiary } from "@/lib/types";

const DISMISSED_KEY = "onboardingDismissed";

const ALL_CATEGORIES: AssetCategory[] = [
  "BANK_ACCOUNT",
  "INVESTMENT_PLATFORM",
  "CRYPTO_WALLET",
  "PENSION_PORTAL",
  "INSURANCE_POLICY",
  "FOREIGN_ACCOUNT",
  "OTHER",
];

function buildChecklist(
  completeness: VaultCompleteness | null,
  beneficiaries: Beneficiary[] | null
): ChecklistItem[] {
  return [
    {
      id: "vault",
      label: "Add your first financial asset",
      done: (completeness?.categoriesCovered ?? 0) > 0,
      href: "/vault/add",
    },
    {
      id: "beneficiary",
      label: "Add a beneficiary",
      done: (beneficiaries?.length ?? 0) > 0,
      href: "/beneficiaries",
    },
    {
      id: "mfa",
      label: "Enable two-factor authentication",
      done: false,
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

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { loading, records, completeness, beneficiaries, inactivity, errors, deleteRecord } =
    useDashboardData();

  const [checklistDismissed, setChecklistDismissed] = useState(false);

  useEffect(() => {
    setChecklistDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  const dismissChecklist = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setChecklistDismissed(true);
  };

  const recordsByCategory = ALL_CATEGORIES.reduce<Record<AssetCategory, typeof records>>(
    (acc, cat) => {
      acc[cat] = records?.filter((r) => r.category === cat) ?? [];
      return acc;
    },
    {} as Record<AssetCategory, typeof records>
  );

  const categoriesWithRecords = ALL_CATEGORIES.filter(
    (c) => (recordsByCategory[c]?.length ?? 0) > 0
  );

  const inactivityVariant =
    inactivity?.stage === 1 ? "warning" : "error";

  const inactivityMessage =
    inactivity?.stage === 1
      ? "You haven't checked in recently. Please confirm you're active."
      : "You have missed multiple check-ins. Your beneficiaries may be notified soon.";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-[28px] text-text-primary">
            {user ? `Good to see you, ${user.firstName}` : "Dashboard"}
          </h1>
          <p className="text-[13.5px] text-text-secondary mt-1">
            Here&apos;s an overview of your financial legacy vault.
          </p>
        </div>

        {/* Inactivity banner — only shown when stage > 0 */}
        {inactivity && inactivity.stage > 0 && (
          <InactivityBanner
            variant={inactivityVariant}
            message={inactivityMessage}
            ctaLabel="Check in now"
          />
        )}

        {/* Health cards */}
        <div className="grid grid-cols-3 gap-4">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <HealthCard
                label="Vault completeness"
                value={errors.completeness ? "—" : `${completeness?.percentComplete ?? 0}%`}
                subtext={
                  errors.completeness
                    ? "Could not load"
                    : `${completeness?.categoriesCovered ?? 0} of ${completeness?.totalCategories ?? 0} categories`
                }
                status={
                  errors.completeness
                    ? "empty"
                    : (completeness?.percentComplete ?? 0) >= 80
                    ? "good"
                    : (completeness?.percentComplete ?? 0) >= 40
                    ? "warning"
                    : "critical"
                }
              />
              <HealthCard
                label="Beneficiaries"
                value={errors.beneficiaries ? "—" : (beneficiaries?.length ?? 0)}
                subtext={
                  errors.beneficiaries
                    ? "Could not load"
                    : (beneficiaries?.length ?? 0) > 0
                    ? `${beneficiaries!.filter((b) => b.status === "ACTIVE").length} active`
                    : "None added yet"
                }
                status={
                  errors.beneficiaries
                    ? "empty"
                    : (beneficiaries?.length ?? 0) > 0
                    ? "good"
                    : "critical"
                }
              />
              <HealthCard
                label="Check-in status"
                value={
                  !inactivity
                    ? "—"
                    : inactivity.stage === 0
                    ? "Active"
                    : inactivity.stage === 1
                    ? "Overdue"
                    : "Critical"
                }
                subtext={
                  inactivity
                    ? `Last: ${new Date(inactivity.lastCheckIn).toLocaleDateString()}`
                    : undefined
                }
                status={
                  !inactivity
                    ? "empty"
                    : inactivity.stage === 0
                    ? "good"
                    : inactivity.stage === 1
                    ? "warning"
                    : "critical"
                }
              />
            </>
          )}
        </div>

        {/* Onboarding checklist */}
        {!checklistDismissed && !loading && (
          <ChecklistCard
            items={buildChecklist(completeness, beneficiaries)}
            onDismiss={dismissChecklist}
          />
        )}

        {/* Assets + Beneficiaries */}
        <div className="grid grid-cols-[1fr_320px] gap-4 items-start">
          {/* Asset accordion */}
          <PanelCard
            title="Your assets"
            action={
              <Link href="/vault/add">
                <Button size="sm" variant="secondary">
                  <Plus size={13} />
                  Add asset
                </Button>
              </Link>
            }
          >
            {loading ? (
              <div className="space-y-1">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : errors.records ? (
              <p className="text-[12.5px] text-red py-2">Failed to load assets.</p>
            ) : categoriesWithRecords.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-[13px] text-text-tertiary mb-3">No assets added yet.</p>
                <Link href="/vault/add">
                  <Button size="sm">Add your first asset</Button>
                </Link>
              </div>
            ) : (
              categoriesWithRecords.map((cat) => (
                <AssetCategoryRow
                  key={cat}
                  category={cat}
                  records={recordsByCategory[cat] ?? []}
                  onDelete={deleteRecord}
                />
              ))
            )}
          </PanelCard>

          {/* Beneficiaries panel */}
          <PanelCard
            title="Beneficiaries"
            action={
              <Link href="/beneficiaries">
                <Button size="sm" variant="secondary">
                  <Plus size={13} />
                  Add
                </Button>
              </Link>
            }
          >
            {loading ? (
              <div className="space-y-1">
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : errors.beneficiaries ? (
              <p className="text-[12.5px] text-red py-2">Failed to load.</p>
            ) : (beneficiaries?.length ?? 0) === 0 ? (
              <div className="py-4 text-center">
                <p className="text-[13px] text-text-tertiary mb-3">No beneficiaries yet.</p>
                <Link href="/beneficiaries">
                  <Button size="sm">Add beneficiary</Button>
                </Link>
              </div>
            ) : (
              beneficiaries!.map((b) => (
                <BeneficiaryRow key={b.id} beneficiary={b} />
              ))
            )}
          </PanelCard>
        </div>
      </div>
    </AppLayout>
  );
}
