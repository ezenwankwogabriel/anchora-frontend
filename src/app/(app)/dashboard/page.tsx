"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FilePlus, FileEdit, Shield, Clock, CheckCircle, AlertTriangle, CreditCard, X } from "lucide-react";
import { HealthCard } from "@/components/ui/health-card";
import { PanelCard } from "@/components/ui/panel-card";
import { ChecklistCard, type ChecklistItem } from "@/components/ui/checklist-card";
import { AssetCategoryRow } from "@/components/ui/asset-category-row";
import { SkeletonCard, SkeletonRow } from "@/components/ui/skeleton-card";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuthStore } from "@/stores/authStore";
import { usePlan } from "@/hooks/usePlan";
import { categoryLabels } from "@/components/ui/category-icon";
import type { AssetCategory, Executor, VaultRecord } from "@/lib/types";
import { DIGITAL_ASSET_CATEGORIES, PHYSICAL_ASSET_CATEGORIES, ALL_VAULT_CATEGORIES } from "@/lib/schemas/vault";

// One-liners for the dashboard checklist's per-category "Add" items —
// deliberately short, low-friction phrasing (see CATEGORY_CHECKLIST_COPY
// usage in buildChecklist below). SUBSCRIPTION is legacy and never
// selectable during onboarding, so it has no entry here.
const CATEGORY_CHECKLIST_COPY: Partial<Record<AssetCategory, string>> = {
  BANK_ACCOUNT:        "Record where you bank so your Trusted Contact knows where to start.",
  INVESTMENT_PLATFORM: "Log your brokerage or investment app so it isn't overlooked.",
  CRYPTO_WALLET:       "Document your exchange or wallet details so it's not lost.",
  PENSION_PORTAL:      "Log your PFA details so your Trusted Contact knows where to look.",
  INSURANCE_POLICY:    "Note your provider and policy so a claim isn't missed.",
  FOREIGN_ACCOUNT:     "Record accounts held abroad so nothing gets left behind.",
  REAL_ESTATE:         "Note the property and where its title documents are kept.",
  VEHICLE:             "Log the vehicle and where its logbook is stored.",
  JEWELRY_WATCHES:     "Describe the item and where it's kept, for anything of lasting value.",
  SHARE_CERTIFICATES:  "Note the certificate and where it's physically stored.",
  OTHER:               "Log anything else worth knowing about, so it isn't forgotten.",
};

const DISMISSED_KEY         = "onboardingDismissed";
const PAST_DUE_DISMISSED_KEY = "pastDueBannerDismissed";

function timeAgo(iso: string): string {
  const diff   = Date.now() - new Date(iso).getTime();
  const mins   = Math.floor(diff / 60_000);
  const hours  = Math.floor(diff / 3_600_000);
  const days   = Math.floor(diff / 86_400_000);
  const weeks  = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (mins  < 2)  return "just now";
  if (hours < 1)  return `${mins}m ago`;
  if (days  < 1)  return `${hours}h ago`;
  if (weeks < 1)  return `${days}d ago`;
  if (months < 1) return `${weeks}w ago`;
  return `${months}mo ago`;
}

type ActivityItem = {
  id: string;
  type: "vault_added" | "vault_updated";
  label: string;
  timestamp: string;
};

const ACTIVITY_ICONS: Record<ActivityItem["type"], React.ReactNode> = {
  vault_added:   <FilePlus size={13} className="text-accent" />,
  vault_updated: <FileEdit size={13} className="text-text-secondary" />,
};

const ACTIVITY_LABELS: Record<ActivityItem["type"], string> = {
  vault_added:   "Added asset",
  vault_updated: "Updated asset",
};

function deriveActivity(records: VaultRecord[] | null): ActivityItem[] {
  return (records ?? [])
    .map((r) => {
      const wasUpdated =
        new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime() > 60_000;
      return {
        id: r.id,
        type: wasUpdated ? ("vault_updated" as const) : ("vault_added" as const),
        label: r.accountName ? `${r.institutionName} · ${r.accountName}` : r.institutionName,
        timestamp: wasUpdated ? r.updatedAt : r.createdAt,
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
}

type ExecutorDashboardState =
  | "NONE"
  | "NOT_NOTIFIED"
  | "PENDING"
  | "VERIFIED"
  | "DECLINED"
  | "ACCEPTED";

function assertNever(value: never): never {
  throw new Error(`Unhandled executor dashboard state: ${String(value)}`);
}

// Precedence mirrors the executor page's own state derivation
// (src/app/(app)/executor/client.tsx): declined/accepted are terminal
// responses; emailVerifiedAt is a separate terminal state for
// account-less executors, who have no accept/decline step to complete.
function getExecutorDashboardState(executor: Executor | null): ExecutorDashboardState {
  if (!executor) return "NONE";
  if (executor.declinedAt) return "DECLINED";
  if (executor.acceptedAt) return "ACCEPTED";
  if (executor.emailVerifiedAt) return "VERIFIED";
  if (!executor.notifiedAt) return "NOT_NOTIFIED";
  return "PENDING";
}

const EXECUTOR_HEALTH_CARD: Record<
  ExecutorDashboardState,
  { value: string; subtext: (name: string) => string; status: "critical" | "warning" | "good" }
> = {
  NONE:         { value: "None",         subtext: () => "No trusted contact designated",           status: "critical" },
  NOT_NOTIFIED: { value: "Not notified", subtext: (name) => `${name} designated, not yet notified`, status: "warning" },
  PENDING:      { value: "Pending",      subtext: (name) => `Invitation sent to ${name}`,          status: "warning" },
  VERIFIED:     { value: "Verified",     subtext: (name) => `${name}'s email is verified`,          status: "good" },
  DECLINED:     { value: "Declined",     subtext: (name) => `${name} declined the invitation`,      status: "critical" },
  ACCEPTED:     { value: "Accepted",     subtext: (name) => `${name} accepted`,                     status: "good" },
};

function renderExecutorNudge(state: ExecutorDashboardState, executor: Executor | null) {
  switch (state) {
    case "NONE":
      return (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Shield size={16} className="text-amber-500 flex-shrink-0 mt-[2px]" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[500] text-amber-900">No trusted contact designated</p>
            <p className="text-[12px] text-amber-700">Your release summary cannot be made available without a trusted contact.</p>
          </div>
          <Link href="/executor" className="text-[12.5px] font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap flex-shrink-0">
            Designate now →
          </Link>
        </div>
      );
    case "NOT_NOTIFIED":
      return (
        <div className="flex items-start gap-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3">
          <Clock size={16} className="text-blue-500 flex-shrink-0 mt-[2px]" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[500] text-blue-900">Trusted contact not yet notified</p>
            <p className="text-[12px] text-blue-700">{executor!.name} won&apos;t know they&apos;ve been designated until you notify them.</p>
          </div>
          <Link href="/executor" className="text-[12.5px] font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap flex-shrink-0">
            View trusted contact →
          </Link>
        </div>
      );
    case "PENDING":
      return (
        <div className="flex items-start gap-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3">
          <Clock size={16} className="text-blue-500 flex-shrink-0 mt-[2px]" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[500] text-blue-900">Trusted contact invitation pending</p>
            <p className="text-[12px] text-blue-700">{executor!.name} has not yet responded.</p>
          </div>
          <Link href="/executor" className="text-[12.5px] font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap flex-shrink-0">
            View trusted contact →
          </Link>
        </div>
      );
    case "VERIFIED":
      return (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-[2px]" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[500] text-emerald-900">Trusted contact email verified</p>
            <p className="text-[12px] text-emerald-700">{executor!.name} has confirmed their email.</p>
          </div>
          <Link href="/executor" className="text-[12.5px] font-semibold text-emerald-700 hover:text-emerald-900 whitespace-nowrap flex-shrink-0">
            View trusted contact →
          </Link>
        </div>
      );
    case "DECLINED":
      return (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-[2px]" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[500] text-amber-900">Trusted contact invitation declined</p>
            <p className="text-[12px] text-amber-700">{executor!.name} declined your invitation. Notify them again or designate someone else.</p>
          </div>
          <Link href="/executor" className="text-[12.5px] font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap flex-shrink-0">
            View trusted contact →
          </Link>
        </div>
      );
    case "ACCEPTED":
      return (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-[2px]" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[500] text-emerald-900">Trusted contact designated</p>
            <p className="text-[12px] text-emerald-700">{executor!.name} accepted the role.</p>
          </div>
          <Link href="/executor" className="text-[12.5px] font-semibold text-emerald-700 hover:text-emerald-900 whitespace-nowrap flex-shrink-0">
            View trusted contact →
          </Link>
        </div>
      );
    default:
      return assertNever(state);
  }
}

// If the user selected categories during onboarding, show one "Add" item
// per category still missing a record — each opens the standard add flow,
// preselected to that category.
// Once a category gets a record, its item just drops off the list rather
// than lingering as a checked-off row; the "Asset coverage" health card
// above already covers that job once everything here is done. Falls back
// to the old generic single item for accounts with no recorded selection
// (pre-existing users, or onboarding categories step was skipped).
function buildChecklist(
  records: VaultRecord[] | null,
  executor: Executor | null,
  selectedCategories: AssetCategory[] | undefined,
): ChecklistItem[] {
  const covered = new Set((records ?? []).map((r) => r.category));
  const selected = selectedCategories ?? [];

  const categoryItems: ChecklistItem[] =
    selected.length > 0
      ? ALL_VAULT_CATEGORIES
          .filter((cat) => selected.includes(cat) && !covered.has(cat))
          .map((cat) => ({
            id: `category-${cat}`,
            label: `Add your ${categoryLabels[cat]}`,
            description: CATEGORY_CHECKLIST_COPY[cat],
            done: false,
            href: `/vault/add?category=${cat}`,
          }))
      : [
          {
            id: "vault",
            label: "Add your first financial asset",
            done: (records?.length ?? 0) > 0,
            href: "/vault/add",
          },
        ];

  return [
    ...categoryItems,
    { id: "executor", label: "Designate your trusted contact", done: executor !== null && !executor.declinedAt, href: "/executor" },
  ];
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { loading, records, executor, error, deleteRecord } = useDashboardData();
  const { planData, loading: planLoading } = usePlan();
  const [pastDueDismissed, setPastDueDismissed] = useState(false);

  useEffect(() => {
    setPastDueDismissed(localStorage.getItem(PAST_DUE_DISMISSED_KEY) === "true");
  }, []);

  // Once the plan is current again, clear a prior dismissal so a future,
  // unrelated renewal failure isn't silently suppressed by an old dismiss.
  useEffect(() => {
    if (planData?.renewalStatus === "current") {
      localStorage.removeItem(PAST_DUE_DISMISSED_KEY);
      setPastDueDismissed(false);
    }
  }, [planData?.renewalStatus]);

  const dismissPastDueBanner = () => {
    localStorage.setItem(PAST_DUE_DISMISSED_KEY, "true");
    setPastDueDismissed(true);
  };

  const digitalCovered = DIGITAL_ASSET_CATEGORIES.filter(
    (c: AssetCategory) => (records ?? []).some((r) => r.category === c)
  ).length;

  const physicalCovered = PHYSICAL_ASSET_CATEGORIES.filter(
    (c) => (records ?? []).some((r) => r.category === c)
  ).length;

  const totalCovered = digitalCovered + physicalCovered;
  const totalCategories = DIGITAL_ASSET_CATEGORIES.length + PHYSICAL_ASSET_CATEGORIES.length;

  const [checklistDismissed, setChecklistDismissed] = useState(false);

  useEffect(() => {
    setChecklistDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  const dismissChecklist = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setChecklistDismissed(true);
  };

  const recordsByCategory = ALL_VAULT_CATEGORIES.reduce<Record<AssetCategory, typeof records>>(
    (acc, cat) => { acc[cat] = records?.filter((r) => r.category === cat) ?? []; return acc; },
    {} as Record<AssetCategory, typeof records>
  );

  const categoriesWithRecords = ALL_VAULT_CATEGORIES.filter(
    (c) => (recordsByCategory[c]?.length ?? 0) > 0
  );

  const recentActivity = deriveActivity(records);
  const executorState = getExecutorDashboardState(executor);

  return (
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

      {/* Health cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <HealthCard
              label="Trusted Contact"
              borderAccent="accent"
              value={EXECUTOR_HEALTH_CARD[executorState].value}
              subtext={EXECUTOR_HEALTH_CARD[executorState].subtext(executor?.name ?? "")}
              status={EXECUTOR_HEALTH_CARD[executorState].status}
            />
            <HealthCard
              label="Asset coverage"
              borderAccent="navy"
              value={error ? "—" : `${totalCovered}/${totalCategories}`}
              subtext={
                error ? "Could not load"
                : totalCovered === totalCategories ? `All ${totalCategories} asset types covered`
                : totalCovered > 0
                  ? `${totalCategories - totalCovered} category type${totalCategories - totalCovered !== 1 ? "s" : ""} not yet recorded`
                  : "No asset categories covered yet"
              }
              status={error ? "empty" : totalCovered === totalCategories ? "good" : totalCovered > 0 ? "warning" : "critical"}
            />
          </>
        )}
      </div>

      {/* Renewal failed banner */}
      {!planLoading && planData?.renewalStatus === "auto_charge_failed" && !pastDueDismissed && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <CreditCard size={16} className="text-amber-500 flex-shrink-0 mt-[2px]" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[500] text-amber-900">Renewal payment failed</p>
            <p className="text-[12px] text-amber-700">
              Your ₦19,900 renewal didn&apos;t go through. Renew manually to keep your Pro access.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/settings?tab=Plan" className="text-[12.5px] font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap">
              Manage plan →
            </Link>
            <button
              type="button"
              onClick={dismissPastDueBanner}
              className="text-amber-500 hover:text-amber-700 transition-colors"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Executor status nudge */}
      {!loading && renderExecutorNudge(executorState, executor)}

      {/* Onboarding checklist */}
      {!checklistDismissed && !loading && (
        <ChecklistCard
          items={buildChecklist(records, executor, user?.onboardingSelectedCategories)}
          onDismiss={dismissChecklist}
        />
      )}

      {/* Assets + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-stretch">
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
            <div className="space-y-1"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
          ) : error ? (
            <p className="text-[12.5px] text-red py-2">Failed to load assets.</p>
          ) : categoriesWithRecords.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-[13px] text-text-tertiary mb-3">No assets added yet.</p>
              <Link href="/vault/add"><Button size="sm">Add your first asset</Button></Link>
            </div>
          ) : (
            categoriesWithRecords.map((cat) => (
              <AssetCategoryRow key={cat} category={cat} records={recordsByCategory[cat] ?? []} onDelete={deleteRecord} />
            ))
          )}
        </PanelCard>

        <PanelCard title="Recent activity">
          {loading ? (
            <div className="space-y-1"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
          ) : recentActivity.length === 0 ? (
            <p className="text-[12.5px] text-text-tertiary py-3 text-center">No activity yet.</p>
          ) : (
            <div>
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-border-color last:border-0">
                  <div className="w-6 h-6 rounded-full bg-surface-2 border border-border-color flex items-center justify-center flex-shrink-0">
                    {ACTIVITY_ICONS[item.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] text-text-tertiary">{ACTIVITY_LABELS[item.type]}</p>
                    <p className="text-[12.5px] font-[500] text-text-primary truncate">{item.label}</p>
                  </div>
                  <span className="text-[11px] text-text-tertiary flex-shrink-0">{timeAgo(item.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
}
