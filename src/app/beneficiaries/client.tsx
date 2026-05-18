"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { BeneficiaryCard } from "@/components/ui/beneficiary-card";
import { Button } from "@/components/ui/button";
import { BeneficiaryService } from "@/services/beneficiary.service";
import type { Beneficiary } from "@/lib/types";

export function BeneficiariesClient() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    BeneficiaryService.getAll()
      .then((data) => setBeneficiaries(data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="max-w-[700px] mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-heading text-[28px] text-text-primary">Beneficiaries</h1>
            <p className="text-[13.5px] text-text-secondary mt-1">
              People who will be notified and given access to your vault.
            </p>
          </div>
          <Link href="/beneficiaries/add">
            <Button size="sm">
              <Plus size={13} />
              Add beneficiary
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 size={24} className="animate-spin text-text-tertiary" />
          </div>
        ) : error ? (
          <p className="text-[13px] text-red text-center py-8">Failed to load beneficiaries.</p>
        ) : (beneficiaries?.length ?? 0) === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px] text-text-secondary mb-1">No beneficiaries yet.</p>
            <p className="text-[13px] text-text-tertiary mb-6">
              Add someone who should have access to your vault.
            </p>
            <Link href="/beneficiaries/add">
              <Button>Add your first beneficiary</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {beneficiaries!.map((b) => (
              <BeneficiaryCard key={b.id} beneficiary={b} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
