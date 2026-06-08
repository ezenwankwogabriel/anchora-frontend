"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PanelCard } from "@/components/ui/panel-card";
import { AssetCategoryRow } from "@/components/ui/asset-category-row";
import { SkeletonRow } from "@/components/ui/skeleton-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { VaultService } from "@/services/vault.service";
import { BeneficiaryService } from "@/services/beneficiary.service";
import { RELATIONSHIP_LABELS } from "@/lib/schemas/beneficiary";
import type { VaultRecord, AssetCategory, SharedVaultItem } from "@/lib/types";

const ALL_CATEGORIES: AssetCategory[] = [
  "BANK_ACCOUNT",
  "INVESTMENT_PLATFORM",
  "CRYPTO_WALLET",
  "PENSION_PORTAL",
  "INSURANCE_POLICY",
  "FOREIGN_ACCOUNT",
  "OTHER",
];

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-[28px] text-text-primary">Your assets</h1>
            <p className="text-[13.5px] text-text-secondary mt-1">
              All financial accounts and assets in your vault.
            </p>
          </div>
          <Link href="/vault/add">
            <Button>
              <Plus size={14} />
              Add asset
            </Button>
          </Link>
        </div>

        <PanelCard>
          {loading ? (
            <div className="space-y-1">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
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
                <SharedVaultRow
                  key={item.id}
                  item={item}
                  last={i === sharedVaults.length - 1}
                />
              ))
            )}
          </PanelCard>
        )}
    </div>
  );
}
