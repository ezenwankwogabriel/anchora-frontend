"use client";

import { useEffect, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { VaultService } from "@/services/vault.service";
import { BeneficiaryService } from "@/services/beneficiary.service";
import { RELATIONSHIP_LABELS } from "@/lib/schemas/beneficiary";
import type { Beneficiary } from "@/lib/types";

interface RecordBeneficiariesProps {
  recordId: string;
}

export function RecordBeneficiaries({ recordId }: RecordBeneficiariesProps) {
  const [assigned, setAssigned]         = useState<Beneficiary[] | null>(null);
  const [allBeneficiaries, setAll]      = useState<Beneficiary[] | null>(null);
  const [loading, setLoading]           = useState(true);
  const [showPicker, setShowPicker]     = useState(false);
  const [adding, setAdding]             = useState<string | null>(null);
  const [removing, setRemoving]         = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      VaultService.getRecordBeneficiaries(recordId),
      BeneficiaryService.getAll(),
    ])
      .then(([a, all]) => {
        setAssigned(a ?? []);
        setAll(all ?? []);
      })
      .catch(() => {
        setAssigned([]);
        setAll([]);
      })
      .finally(() => setLoading(false));
  }, [recordId]);

  const assignedIds = new Set(assigned?.map((b) => b.id) ?? []);
  const available   = (allBeneficiaries ?? []).filter((b) => !assignedIds.has(b.id));

  const handleAdd = async (beneficiaryId: string) => {
    setAdding(beneficiaryId);
    try {
      await VaultService.assignBeneficiary(recordId, beneficiaryId);
      const b = allBeneficiaries!.find((x) => x.id === beneficiaryId)!;
      setAssigned((prev) => [...(prev ?? []), b]);
      setShowPicker(false);
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (beneficiaryId: string) => {
    setRemoving(beneficiaryId);
    try {
      await VaultService.removeRecordBeneficiary(recordId, beneficiaryId);
      setAssigned((prev) => (prev ?? []).filter((b) => b.id !== beneficiaryId));
    } finally {
      setRemoving(null);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();

  return (
    <div className="mt-6 pt-5 border-t border-border-color">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13.5px] font-semibold text-text-primary">Who can access this record</h3>
        {!showPicker && available.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center gap-1.5 text-[12.5px] text-accent hover:text-accent-hover transition-colors bg-transparent border-none cursor-pointer font-sans"
          >
            <Plus size={13} />
            Assign
          </button>
        )}
      </div>

      {loading ? (
        <Loader2 size={16} className="animate-spin text-text-tertiary" />
      ) : (
        <>
          {(assigned?.length ?? 0) === 0 && !showPicker ? (
            <p className="text-[12.5px] text-text-tertiary">
              No beneficiaries assigned.{" "}
              {available.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="text-accent hover:underline bg-transparent border-none cursor-pointer font-sans text-[12.5px]"
                >
                  Assign one
                </button>
              )}
            </p>
          ) : (
            <div className="space-y-2 mb-3">
              {assigned!.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 py-2 px-3 bg-surface-2 rounded-lg"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-navy to-accent flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0">
                    {getInitials(b.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-[500] text-text-primary truncate">{b.name}</p>
                    <p className="text-[11px] text-text-tertiary">
                      {RELATIONSHIP_LABELS[b.relationship]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(b.id)}
                    disabled={removing === b.id}
                    className="text-text-tertiary hover:text-red transition-colors p-1 bg-transparent border-none cursor-pointer"
                    aria-label="Remove"
                  >
                    {removing === b.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <X size={13} />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {showPicker && (
            <div className="mt-2 bg-surface border border-border-color rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border-color flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-text-primary">
                  Select beneficiary
                </span>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="text-text-tertiary hover:text-text-primary bg-transparent border-none cursor-pointer"
                >
                  <X size={14} />
                </button>
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
                    disabled={!!adding}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors border-b border-border-color last:border-0 text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-navy to-accent flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0">
                      {getInitials(b.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-[500] text-text-primary">{b.name}</p>
                      <p className="text-[11px] text-text-tertiary">
                        {RELATIONSHIP_LABELS[b.relationship]}
                      </p>
                    </div>
                    {adding === b.id && (
                      <Loader2 size={13} className="animate-spin text-text-tertiary" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
