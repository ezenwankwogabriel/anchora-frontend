"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PanelCard } from "@/components/ui/panel-card";
import { AssetCategoryRow } from "@/components/ui/asset-category-row";
import { SkeletonRow } from "@/components/ui/skeleton-card";
import { Button } from "@/components/ui/button";
import { VaultService } from "@/services/vault.service";
import type { VaultRecord, AssetCategory } from "@/lib/types";

const ALL_CATEGORIES: AssetCategory[] = [
  "BANK_ACCOUNT",
  "INVESTMENT_PLATFORM",
  "CRYPTO_WALLET",
  "PENSION_PORTAL",
  "INSURANCE_POLICY",
  "FOREIGN_ACCOUNT",
  "OTHER",
];

export default function VaultClient() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<VaultRecord[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    VaultService.getRecords()
      .then((data) => setRecords(data ?? []))
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
    <AppLayout>
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
      </div>
    </AppLayout>
  );
}
