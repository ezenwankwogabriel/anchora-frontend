"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Download, FileText } from "lucide-react";
import { PanelCard } from "@/components/ui/panel-card";
import { AssetCategoryRow } from "@/components/ui/asset-category-row";
import { SkeletonRow } from "@/components/ui/skeleton-card";
import { Button } from "@/components/ui/button";
import { PaywallModal } from "@/components/ui/paywall-modal";
import { VaultService } from "@/services/vault.service";
import { usePlan } from "@/hooks/usePlan";
import { useToastStore } from "@/stores/toastStore";
import type { VaultRecord, AssetCategory } from "@/lib/types";
import { ALL_VAULT_CATEGORIES } from "@/lib/schemas/vault";
import http from "@/lib/axios";


const FREE_RECORD_LIMIT = 3;

export default function VaultClient() {
  const [loading, setLoading]         = useState(true);
  const [records, setRecords]         = useState<VaultRecord[] | null>(null);
  const [error, setError]             = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [showPaywall, setShowPaywall] = useState(false);
  const { isPro, isFree, loading: planLoading, refetch: refetchPlan } = usePlan();
  const addToast = useToastStore((s) => s.add);

  useEffect(() => {
    VaultService.getRecords()
      .then((recs) => setRecords(recs ?? []))
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

  const recordsByCategory = ALL_VAULT_CATEGORIES.reduce<Record<AssetCategory, VaultRecord[]>>(
    (acc, cat) => {
      acc[cat] = records?.filter((r) => r.category === cat) ?? [];
      return acc;
    },
    {} as Record<AssetCategory, VaultRecord[]>
  );

  const categoriesWithRecords = ALL_VAULT_CATEGORIES.filter(
    (c) => (recordsByCategory[c]?.length ?? 0) > 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[28px] text-text-primary">Your assets</h1>
          <p className="text-[13.5px] text-text-secondary mt-1">
            All financial accounts and assets in your vault. Your asset records,
            not your logins or passwords.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {atLimit ? (
            <Button onClick={() => setShowPaywall(true)}>
              <Plus size={14} />
              Add asset
            </Button>
          ) : (
            <Link href="/vault/add">
              <Button>
                <Plus size={14} />
                Add asset
              </Button>
            </Link>
          )}
          {!planLoading && isFree && (
            <p className="text-[11.5px] text-text-tertiary">
              {atLimit
                ? "Free limit reached · Upgrade to add more"
                : `${remaining} free record${remaining !== 1 ? "s" : ""} remaining`}
            </p>
          )}
        </div>
      </div>

      {/* Release summary row */}
      {!planLoading && (
        <div className="bg-surface border border-border-color rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-navy" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] text-text-secondary">
              {isPro
                ? "This is the document your trusted contact will receive at release."
                : "Preview a sample summary - the same shape your trusted contact will see. Available on Pro."}
            </p>
          </div>
          <div className="flex-shrink-0">
            {isPro ? (
              <Button variant="secondary" size="sm" onClick={handleDownloadReport} disabled={downloading}>
                {downloading ? (
                  "Generating..."
                ) : (
                  <><Download size={13} /> Download</>
                )}
              </Button>
            ) : (
              <Link href="/settings/upgrade">
                <Button size="sm">Upgrade to Pro</Button>
              </Link>
            )}
          </div>
        </div>
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

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgraded={() => { setShowPaywall(false); refetchPlan(); }}
      />
    </div>
  );
}
