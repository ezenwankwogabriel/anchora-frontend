"use client";

import { X } from "lucide-react";
import { BeneficiaryForm } from "@/components/beneficiary/beneficiary-form";
import { BeneficiaryService } from "@/services/beneficiary.service";
import type { Beneficiary, BeneficiaryInput } from "@/lib/types";

interface AddBeneficiaryDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (beneficiary: Beneficiary) => void;
}

export function AddBeneficiaryDialog({ open, onClose, onSuccess }: AddBeneficiaryDialogProps) {
  if (!open) return null;

  const handleSubmit = async (data: BeneficiaryInput) => {
    const beneficiary = await BeneficiaryService.create(data);
    onSuccess(beneficiary);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative z-10 bg-surface rounded-2xl border border-border-color shadow-md w-full max-w-[480px] p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-heading text-[22px] text-text-primary">Add beneficiary</h2>
            <p className="text-[13px] text-text-secondary mt-0.5">
              They&apos;ll receive an email invitation to join Anchora.
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

        <BeneficiaryForm onSubmit={handleSubmit} onCancel={onClose} />
      </div>
    </div>
  );
}
