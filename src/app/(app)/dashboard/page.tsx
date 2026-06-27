"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FilePlus, FileEdit, Shield, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { HealthCard } from "@/components/ui/health-card";
import { PanelCard } from "@/components/ui/panel-card";
import { ChecklistCard, type ChecklistItem } from "@/components/ui/checklist-card";
import { AssetCategoryRow } from "@/components/ui/asset-category-row";
import { SkeletonCard, SkeletonRow } from "@/components/ui/skeleton-card";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuthStore } from "@/stores/authStore";
import type { AssetCategory, Executor, VaultRecord } from "@/lib/types";
import { DIGITAL_ASSET_CATEGORIES, PHYSICAL_ASSET_CATEGORIES, ALL_VAULT_CATEGORIES } from "@/lib/schemas/vault";

const DISMISSED_KEY = "onboardingDismissed";

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
        label: r.accountName ? `${r.institutionName} — ${r.accountName}` : r.institutionName,
        timestamp: wasUpdated ? r.updatedAt : r.createdAt,
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
}

function buildChecklist(hasRecords: boolean, executor: Executor | null): ChecklistItem[] {
  return [
    { id: "vault",    label: "Add your first financial asset", done: hasRecords,                                        href: "/vault/add" },
    { id: "executor", label: "Designate your executor",        done: executor !== null && executor.status !== "DECLINED", href: "/executor" },
  ];
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { loading, records, executor, error, deleteRecord } = useDashboardData();

  const totalRecords  = records?.length ?? 0;
  const intentSet     = records?.filter((r) => r.executorIntent !== "UNSPECIFIED").length ?? 0;

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <HealthCard
              label="Assets with intent"
              borderAccent="green"
              value={error ? "—" : `${intentSet} / ${totalRecords}`}
              subtext={
                error ? "Could not load"
                : totalRecords === 0 ? "No assets yet"
                : intentSet === totalRecords ? "All assets documented"
                : `${totalRecords - intentSet} still unspecified`
              }
              status={
                error ? "empty"
                : totalRecords > 0 && intentSet === totalRecords ? "good"
                : intentSet > 0 ? "warning"
                : "critical"
              }
            />
            <HealthCard
              label="Executor"
              borderAccent="accent"
              value={
                executor === null                       ? "None"
                : executor.status === "PENDING_INVITE" ? "Pending"
                : executor.status === "ACTIVE"         ? "Active"
                : executor.status === "DECLINED"       ? "Declined"
                : executor.status
              }
              subtext={
                executor === null                       ? "No executor designated"
                : executor.status === "PENDING_INVITE" ? `Invitation sent to ${executor.name}`
                : executor.status === "ACTIVE"         ? `${executor.name} is active`
                : executor.status === "DECLINED"       ? `${executor.name} declined the invitation`
                : executor.name
              }
              status={
                executor === null                       ? "critical"
                : executor.status === "PENDING_INVITE" ? "warning"
                : executor.status === "ACTIVE"         ? "good"
                : executor.status === "DECLINED"       ? "critical"
                : "warning"
              }
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

      {/* Executor status nudge */}
      {!loading && (
        executor === null ? (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Shield size={16} className="text-amber-500 flex-shrink-0 mt-[2px]" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-[500] text-amber-900">No executor designated</p>
              <p className="text-[12px] text-amber-700">Your estate report cannot be delivered without an executor.</p>
            </div>
            <Link href="/executor" className="text-[12.5px] font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap flex-shrink-0">
              Designate now →
            </Link>
          </div>
        ) : executor.status === "PENDING_INVITE" ? (
          <div className="flex items-start gap-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3">
            <Clock size={16} className="text-blue-500 flex-shrink-0 mt-[2px]" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-[500] text-blue-900">Executor invitation pending</p>
              <p className="text-[12px] text-blue-700">{executor.name} has not yet accepted their invitation.</p>
            </div>
            <Link href="/executor" className="text-[12.5px] font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap flex-shrink-0">
              View executor →
            </Link>
          </div>
        ) : executor.status === "DECLINED" ? (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-[2px]" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-[500] text-amber-900">Executor invitation declined</p>
              <p className="text-[12px] text-amber-700">{executor.name} declined your invitation. Resend or designate someone else.</p>
            </div>
            <Link href="/executor" className="text-[12.5px] font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap flex-shrink-0">
              View executor →
            </Link>
          </div>
        ) : executor.status === "ACTIVE" ? (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-[2px]" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-[500] text-emerald-900">Executor designated</p>
              <p className="text-[12px] text-emerald-700">{executor.name} is active.</p>
            </div>
            <Link href="/executor" className="text-[12.5px] font-semibold text-emerald-700 hover:text-emerald-900 whitespace-nowrap flex-shrink-0">
              View executor →
            </Link>
          </div>
        ) : null
      )}

      {/* Onboarding checklist */}
      {!checklistDismissed && !loading && (
        <ChecklistCard
          items={buildChecklist((records?.length ?? 0) > 0, executor)}
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
