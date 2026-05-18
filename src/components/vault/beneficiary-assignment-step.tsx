"use client";

import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BeneficiaryService } from "@/services/beneficiary.service";
import { RELATIONSHIP_LABELS } from "@/lib/schemas/beneficiary";
import type { Beneficiary } from "@/lib/types";

interface BeneficiaryAssignmentStepProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onBack: () => void;
  onSave: (ids: string[]) => Promise<void>;
}

export function BeneficiaryAssignmentStep({
  selectedIds,
  onChange,
  onBack,
  onSave,
}: BeneficiaryAssignmentStepProps) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[] | null>(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
    BeneficiaryService.getAll()
      .then((data) => setBeneficiaries(data ?? []))
      .catch(() => setBeneficiaries([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  const handleSave = async (ids: string[]) => {
    setSaving(true);
    try {
      await onSave(ids);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="font-heading text-[22px] text-text-primary mb-1">
        Who can access this?
      </h2>
      <p className="text-[13.5px] text-text-secondary mb-6">
        Optionally assign beneficiaries who can see this record.
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={22} className="animate-spin text-text-tertiary" />
        </div>
      ) : (beneficiaries?.length ?? 0) === 0 ? (
        <div className="bg-surface border border-border-color rounded-xl px-5 py-6 text-center mb-6">
          <p className="text-[13px] text-text-tertiary">
            No beneficiaries added yet. You can assign access later from the asset&apos;s edit page.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {beneficiaries!.map((b) => {
            const selected = selectedIds.includes(b.id);
            const initials = b.name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0])
              .join("")
              .toUpperCase();

            return (
              <button
                key={b.id}
                type="button"
                onClick={() => toggle(b.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                  selected
                    ? "border-accent bg-accent-light"
                    : "border-border-color bg-surface hover:bg-surface-2"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-accent flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-[500] text-text-primary">{b.name}</p>
                  <p className="text-[11.5px] text-text-tertiary">
                    {RELATIONSHIP_LABELS[b.relationship]}
                  </p>
                </div>
                {selected && (
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button fullWidth onClick={() => handleSave(selectedIds)} disabled={saving}>
          {saving && <Loader2 size={15} className="animate-spin" />}
          Save asset →
        </Button>
        {(beneficiaries?.length ?? 0) > 0 && (
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => handleSave([])}
            disabled={saving}
          >
            Skip for now
          </Button>
        )}
        <Button type="button" variant="ghost" fullWidth onClick={onBack} disabled={saving}>
          ← Back
        </Button>
      </div>
    </div>
  );
}
