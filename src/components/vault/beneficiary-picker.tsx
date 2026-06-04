"use client";

import { useEffect, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { BeneficiaryService } from "@/services/beneficiary.service";
import { AddBeneficiaryDialog } from "@/components/ui/add-beneficiary-dialog";
import { RELATIONSHIP_LABELS } from "@/lib/schemas/beneficiary";
import { useToastStore } from "@/stores/toastStore";
import type { Beneficiary } from "@/lib/types";

interface BeneficiaryPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function BeneficiaryPicker({ selectedIds, onChange }: BeneficiaryPickerProps) {
  const [all, setAll]             = useState<Beneficiary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [addOpen, setAddOpen]     = useState(false);
  const addToast                  = useToastStore((s) => s.add);

  useEffect(() => {
    BeneficiaryService.getAll()
      .then((data) => setAll(data ?? []))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, []);

  const selected  = all.filter((b) => selectedIds.includes(b.id));
  const available = all.filter((b) => !selectedIds.includes(b.id));

  const handleAdd = (id: string) => {
    onChange([...selectedIds, id]);
    setShowPicker(false);
  };

  const handleRemove = (id: string) => onChange(selectedIds.filter((x) => x !== id));

  const handleBeneficiaryAdded = (b: Beneficiary) => {
    setAll((prev) => [...prev, b]);
    onChange([...selectedIds, b.id]);
    setAddOpen(false);
    if (b.status === "INVITED") {
      setTimeout(() => addToast(`Invite sent to ${b.email}`, "success"), 0);
    }
  };

  return (
    <div className="mt-6 pt-5 border-t border-border-color">
      <h3 className="text-[13.5px] font-semibold text-text-primary mb-3">
        Who can access this record
      </h3>

      {loading ? (
        <Loader2 size={15} className="animate-spin text-text-tertiary" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {selected.map((b) => (
              <div
                key={b.id}
                className="inline-flex items-center gap-2 pl-1 pr-2 py-1 bg-surface-2 border border-border-color rounded-full"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-navy to-accent flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0">
                  {getInitials(b.name)}
                </div>
                <span className="text-[12px] font-[500] text-text-primary leading-none">
                  {b.name}
                </span>
                <span className="text-[10.5px] text-text-tertiary leading-none">
                  {RELATIONSHIP_LABELS[b.relationship]}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(b.id)}
                  className="ml-0.5 text-text-tertiary hover:text-red transition-colors bg-transparent border-none cursor-pointer p-0.5 rounded-full"
                  aria-label="Remove"
                >
                  <X size={11} />
                </button>
              </div>
            ))}

            {!showPicker && (
              <button
                type="button"
                onClick={() => all.length === 0 ? setAddOpen(true) : setShowPicker(true)}
                className="inline-flex items-center gap-1.5 pl-2 pr-3 py-1 border border-dashed border-border-color rounded-full text-[12px] text-accent hover:border-accent hover:bg-accent-light transition-colors bg-transparent cursor-pointer font-sans"
              >
                <Plus size={12} />
                Assign
              </button>
            )}
          </div>

          {showPicker && (
            <div className="mt-3 bg-surface border border-border-color rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 border-b border-border-color flex items-center justify-between">
                <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-[0.05em]">
                  Select beneficiary
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="inline-flex items-center gap-1 text-[12px] text-accent bg-transparent border-none cursor-pointer font-sans"
                  >
                    <Plus size={12} />
                    New
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPicker(false)}
                    className="text-text-tertiary hover:text-text-primary bg-transparent border-none cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              {available.length === 0 ? (
                <p className="text-[12.5px] text-text-tertiary px-4 py-4">
                  All beneficiaries are already assigned.
                </p>
              ) : (
                available.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleAdd(b.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors border-b border-border-color last:border-0 text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-navy to-accent flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0">
                      {getInitials(b.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-[500] text-text-primary">{b.name}</p>
                      <p className="text-[11px] text-text-tertiary">{RELATIONSHIP_LABELS[b.relationship]}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}

      <AddBeneficiaryDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={handleBeneficiaryAdded}
      />
    </div>
  );
}
