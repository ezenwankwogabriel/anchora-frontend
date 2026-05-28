"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GuardianService } from "@/services/guardian.service";
import { ServiceError } from "@/lib/types";
import type { Guardian, Beneficiary } from "@/lib/types";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  email:     z.string().email("Enter a valid email"),
});
type FormData = z.infer<typeof schema>;
const zodResolver = _zodResolver as unknown as (s: z.ZodTypeAny) => Resolver<FormData>;

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
      {text}{required && " *"}
    </label>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (guardian: Guardian) => void;
  onRemoved: () => void;
  guardian?: Guardian | null;
  beneficiaries: Beneficiary[];
}

export function GuardianDialog({ open, onClose, onSaved, onRemoved, guardian, beneficiaries }: Props) {
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState(guardian?.beneficiaryId ?? "");
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { firstName: guardian?.firstName ?? "", email: guardian?.email ?? "" },
    });

  if (!open) return null;

  const handleBeneficiarySelect = (id: string, resetFn: (v: FormData) => void, currentValues: FormData) => {
    const b = beneficiaries.find((b) => b.id === id);
    setSelectedBeneficiaryId(id);
    if (b) resetFn({ ...currentValues, firstName: b.name.split(" ")[0], email: b.email });
  };

  const onSubmit = async (values: FormData) => {
    setError(null);
    try {
      const saved = await GuardianService.upsert({
        firstName: values.firstName,
        email:     values.email,
        ...(selectedBeneficiaryId ? { beneficiaryId: selectedBeneficiaryId } : {}),
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : "Failed to save — please try again");
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      await GuardianService.remove();
      onRemoved();
      onClose();
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : "Failed to remove guardian");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative z-10 bg-surface rounded-2xl border border-border-color shadow-md w-full max-w-[480px] p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-heading text-[22px] text-text-primary">
              {guardian ? "Update guardian" : "Set a guardian"}
            </h2>
            <p className="text-[13px] text-text-secondary mt-0.5">
              A trusted person who confirms your vault release.
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {beneficiaries.length > 0 && (
            <div>
              <FieldLabel text="Link to a beneficiary (optional)" />
              <select
                value={selectedBeneficiaryId}
                onChange={(e) =>
                  handleBeneficiarySelect(e.target.value, reset, {
                    firstName: (document.querySelector('[name="firstName"]') as HTMLInputElement)?.value ?? "",
                    email:     (document.querySelector('[name="email"]') as HTMLInputElement)?.value ?? "",
                  })
                }
                className="w-full border border-border-color rounded-lg px-3 py-2 text-[13px] text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="">— Enter manually —</option>
                {beneficiaries.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.email})</option>
                ))}
              </select>
              <p className="text-[11.5px] text-text-tertiary mt-1">
                Selecting a beneficiary pre-fills the fields below.
              </p>
            </div>
          )}

          <div>
            <FieldLabel text="First name" required />
            <Input {...register("firstName")} placeholder="e.g. Jane" />
            {errors.firstName && (
              <p className="text-[11.5px] text-red mt-[5px]">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <FieldLabel text="Email address" required />
            <Input {...register("email")} type="email" placeholder="e.g. jane@example.com" />
            {errors.email && (
              <p className="text-[11.5px] text-red mt-[5px]">{errors.email.message}</p>
            )}
          </div>

          {error && (
            <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={13} className="animate-spin" />}
              Save guardian
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>

        {guardian && (
          <div className="mt-4 pt-4 border-t border-border-color">
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="flex items-center gap-1.5 text-[12.5px] text-red hover:text-red/80 transition-colors"
            >
              {removing && <Loader2 size={12} className="animate-spin" />}
              Remove guardian
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
