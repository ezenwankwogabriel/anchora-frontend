"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { BeneficiaryForm } from "@/components/beneficiary/beneficiary-form";
import { BeneficiaryService } from "@/services/beneficiary.service";
import type { Beneficiary, BeneficiaryInput } from "@/lib/types";

interface BeneficiaryDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (beneficiary: Beneficiary) => void;
  onDeleted?: () => void;
  beneficiary?: Beneficiary;
}

export function AddBeneficiaryDialog({
  open,
  onClose,
  onSuccess,
  onDeleted,
  beneficiary,
}: BeneficiaryDialogProps) {
  const [removing, setRemoving] = useState(false);

  if (!open) return null;

  const isEdit = !!beneficiary;

  const handleSubmit = async (data: BeneficiaryInput) => {
    const result = isEdit
      ? await BeneficiaryService.update(beneficiary.id, data)
      : await BeneficiaryService.create(data);
    onSuccess(result);
  };

  const handleRemove = async () => {
    if (!beneficiary) return;
    setRemoving(true);
    try {
      await BeneficiaryService.remove(beneficiary.id);
      onDeleted?.();
      onClose();
    } finally {
      setRemoving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative z-10 bg-surface rounded-2xl border border-border-color shadow-md w-full max-w-[480px] p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-heading text-[22px] text-text-primary">
              {isEdit ? "Edit beneficiary" : "Add beneficiary"}
            </h2>
            <p className="text-[13px] text-text-secondary mt-0.5">
              {isEdit
                ? "Update their details or remove them from your vault."
                : "Add someone to give them access to this vault."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer ml-4 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <BeneficiaryForm
          beneficiary={isEdit ? {
            name:         beneficiary.name,
            email:        beneficiary.email,
            relationship: beneficiary.relationship,
            isDefault:    beneficiary.isDefault,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />

        {isEdit && (
          <div className="mt-4 pt-4 border-t border-border-color">
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="flex items-center gap-1.5 text-[12.5px] text-red hover:text-red/80 transition-colors"
            >
              {removing && <Loader2 size={12} className="animate-spin" />}
              Remove {beneficiary.name.split(" ")[0]} from your vault
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
