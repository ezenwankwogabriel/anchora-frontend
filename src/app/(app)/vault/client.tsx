"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Download, FileText } from "lucide-react";
import { PanelCard } from "@/components/ui/panel-card";
import { AssetCategoryRow } from "@/components/ui/asset-category-row";
import { SkeletonRow } from "@/components/ui/skeleton-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { VaultService } from "@/services/vault.service";
import { BeneficiaryService } from "@/services/beneficiary.service";
import { usePlan } from "@/hooks/usePlan";
import { useToastStore } from "@/stores/toastStore";
import { RELATIONSHIP_LABELS } from "@/lib/schemas/beneficiary";
import type { VaultRecord, AssetCategory, SharedVaultItem } from "@/lib/types";
import http from "@/lib/axios";

const ALL_CATEGORIES: AssetCategory[] = [
  "BANK_ACCOUNT",
  "INVESTMENT_PLATFORM",
  "CRYPTO_WALLET",
  "PENSION_PORTAL",
  "INSURANCE_POLICY",
  "FOREIGN_ACCOUNT",
  "OTHER",
];

const FREE_RECORD_LIMIT = 3;

function SharedVaultRow({ item, last }: { item: SharedVaultItem; last: boolean }) {
  const initials = item.ownerName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const statusVariant = item.status === "ACTIVE" ? "success" : "info";
  const statusLabel   = item.status === "ACTIVE" ? "Active" : "Linked";

  const addedAt = new Date(item.linkedAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className={`flex items-center gap-4 px-5 py-4 ${!last ? "border-b border-border-color" : ""}`}>
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy to-accent flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-[2px]">
          <p className="text-[13.5px] font-[600] text-text-primary">{item.ownerName}</p>
          <StatusBadge variant={statusVariant} label={statusLabel} />
        </div>
        <p className="text-[12px] text-text-tertiary">
          Their {RELATIONSHIP_LABELS[item.relationship]} · Added {addedAt}
        </p>
      </div>
      {item.assetCount > 0 && (
        <p className="text-[12px] text-text-tertiary flex-shrink-0">
          {item.assetCount} {item.assetCount === 1 ? "asset" : "assets"}
        </p>
      )}
    </div>
  );
}

export default function VaultClient() {
  const [loading, setLoading]           = useState(true);
  const [records, setRecords]           = useState<VaultRecord[] | null>(null);
  const [sharedVaults, setSharedVaults] = useState<SharedVaultItem[]>([]);
  const [error, setError]               = useState(false);
  const [downloading, setDownloading]   = useState(false);

  const { isPro, isFree, loading: planLoading } = usePlan();
  const addToast = useToastStore((s) => s.add);

  useEffect(() => {
    Promise.all([VaultService.getRecords(), BeneficiaryService.getSharedWithMe()])
      .then(([recs, shared]) => {
        setRecords(recs ?? []);
        setSharedVaults(shared ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const deleteRecord = (id: string) => {
    VaultService.deleteRecord(id).then(() =>
      setRecords((prev) => prev?.filter((r) => r.id !== id) ?? null)
    );
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const res = await http.get<{ url: string; expiresAt: string }>("/vault/report/download");
      window.open(res.data.url, "_blank");
    } catch {
      addToast("Failed to generate report. Try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const recordCount = records?.length ?? 0;
  const atLimit     = isFree && recordCount >= FREE_RECORD_LIMIT;
  const remaining   = FREE_RECORD_LIMIT - recordCount;

  const recordsByCategory = ALL_CATEGORIES.reduce<Record<AssetCategory, VaultRecord[]>>(
    (acc, cat) => {
      acc[cat] = records?.filter((r) => r.category === cat) ?? [];
      return acc;
    },
    {} as Record<AssetCategory, VaultRecord[]>
  );

  const categoriesWithRecords = ALL_CATEGORIES.filter(
    (c) => (recordsByCategory[c]?.length ?? 0) > 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[28px] text-text-primary">Your assets</h1>
          <p className="text-[13.5px] text-text-secondary mt-1">
            All financial accounts and assets in your vault.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Link href="/vault/add">
            <Button disabled={atLimit} className={atLimit ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}>
              <Plus size={14} />
              Add asset
            </Button>
          </Link>
          {!planLoading && isFree && !atLimit && remaining > 0 && (
            <p className="text-[11.5px] text-text-tertiary">
              {remaining} free record{remaining !== 1 ? "s" : ""} remaining
            </p>
          )}
        </div>
      </div>

      {/* Estate summary card */}
      {!planLoading && (
        <div className="bg-surface border border-border-color rounded-xl shadow-sm p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-navy" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px] text-text-primary">Estate summary</p>
            <p className="text-[13px] text-text-secondary mt-0.5">
              A structured document your executor will use to recover and manage your assets.
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
            {isPro ? (
              <>
                <Button variant="secondary" size="sm" onClick={handleDownloadReport} disabled={downloading}>
                  {downloading ? (
                    "Generating..."
                  ) : (
                    <><Download size={13} /> Download summary</>
                  )}
                </Button>
                <p className="text-[11px] text-text-tertiary">Generated as a PDF · Link expires in 24 hours</p>
              </>
            ) : (
              <UpgradePrompt
                feature="Estate summary download"
                description="Download a structured PDF estate document to share with your lawyer or review with your executor. Available on Pro."
              />
            )}
          </div>
        </div>
      )}

      {/* Vault limit upgrade prompt */}
      {!planLoading && atLimit && (
        <UpgradePrompt
          feature="Unlimited asset records"
          description="Free plan includes up to 3 records. Upgrade to Pro to add unlimited assets across all categories."
        />
      )}

      {/* Asset list */}
      <PanelCard>
        {loading ? (
          <div className="space-y-1">
            <SkeletonRow /><SkeletonRow /><SkeletonRow />
          </div>
        ) : error ? (
          <p className="text-[12.5px] text-red py-2">Failed to load assets.</p>
        ) : categoriesWithRecords.length === 0 ? (
          <div className="py-10 text-center">
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

      {/* Shared with you */}
      {!loading && !error && (
        <PanelCard title="Shared with you">
          {sharedVaults.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[13px] text-text-secondary mb-1">No shared vaults yet.</p>
              <p className="text-[12px] text-text-tertiary">
                When someone adds you as a beneficiary and you accept, their vault appears here.
                Check your email for any pending invitations.
              </p>
            </div>
          ) : (
            sharedVaults.map((item, i) => (
              <SharedVaultRow key={item.id} item={item} last={i === sharedVaults.length - 1} />
            ))
          )}
        </PanelCard>
      )}
    </div>
  );
}
