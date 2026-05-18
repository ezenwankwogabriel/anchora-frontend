"use client";

import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { ServiceError } from "@/lib/types";
import type { BeneficiaryInput, Relationship } from "@/lib/types";
import {
  beneficiarySchema,
  RELATIONSHIPS,
  RELATIONSHIP_LABELS,
  type BeneficiaryFormData,
} from "@/lib/schemas/beneficiary";

const zodResolver = _zodResolver as unknown as (
  schema: typeof beneficiarySchema
) => Resolver<BeneficiaryFormData>;

interface BeneficiaryFormProps {
  beneficiary?: {
    name: string;
    email: string;
    relationship: Relationship;
    isDefault: boolean;
  };
  onSubmit: (data: BeneficiaryInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
      {text}{required && " *"}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11.5px] text-red mt-[5px]">{message}</p>;
}

export function BeneficiaryForm({ beneficiary, onSubmit, onCancel, submitLabel }: BeneficiaryFormProps) {
  const defaultValues: BeneficiaryFormData = beneficiary
    ? {
        name:         beneficiary.name,
        email:        beneficiary.email,
        relationship: beneficiary.relationship,
        isDefault:    beneficiary.isDefault,
      }
    : {
        name:         "",
        email:        "",
        relationship: "OTHER",
        isDefault:    false,
      };

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues,
  });

  const handleFormSubmit = async (values: BeneficiaryFormData) => {
    try {
      await onSubmit({
        name:         values.name,
        email:        values.email,
        relationship: values.relationship,
        isDefault:    values.isDefault,
      });
    } catch (err) {
      setError("root", {
        message: err instanceof ServiceError ? err.message : "Something went wrong",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <FormSection>
        <FieldLabel text="Full name" required />
        <Input placeholder="e.g. Jane Smith" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </FormSection>

      <FormSection>
        <FieldLabel text="Email address" required />
        <Input type="email" placeholder="e.g. jane@example.com" {...register("email")} />
        <FieldError message={errors.email?.message} />
      </FormSection>

      <FormSection>
        <FieldLabel text="Relationship" required />
        <Select {...register("relationship")}>
          {RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>{RELATIONSHIP_LABELS[r]}</option>
          ))}
        </Select>
        <FieldError message={errors.relationship?.message} />
      </FormSection>

      <FormSection divider>
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-[13px] font-[500] text-text-primary">Set as default</p>
            <p className="text-[11.5px] text-text-tertiary">
              Primary contact when your vault is accessed
            </p>
          </div>
          <Controller
            name="isDefault"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                role="switch"
                aria-checked={!!field.value}
                onClick={() => field.onChange(!field.value)}
                className={cn(
                  "relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0",
                  field.value ? "bg-accent" : "bg-border-color"
                )}
              >
                <span
                  className={cn(
                    "absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200",
                    field.value ? "translate-x-[19px]" : "translate-x-[3px]"
                  )}
                />
              </button>
            )}
          />
        </div>
      </FormSection>

      {errors.root && (
        <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
          {errors.root.message}
        </p>
      )}

      <div className="flex flex-col gap-2 mt-2">
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {submitLabel ?? (beneficiary ? "Save changes →" : "Add beneficiary →")}
        </Button>
        <Button type="button" variant="ghost" fullWidth onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
