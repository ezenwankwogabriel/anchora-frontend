"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";

// Zod v4 sets Input=unknown on ZodType<T>, breaking zodResolver's overload.
// Casting the resolver function itself (not the schema) avoids the mismatch
// without using `any`.
const zodResolver = _zodResolver as unknown as (
  schema: ReturnType<typeof getCategorySchema>
) => Resolver<VaultFormData>;
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { CharacterCounter } from "@/components/ui/character-counter";
import { InfoBanner } from "@/components/ui/info-banner";
import { ServiceError } from "@/lib/types";
import type { VaultRecord, VaultRecordInput, AssetCategory } from "@/lib/types";
import {
  getCategorySchema,
  CATEGORY_CONFIG,
  type VaultFormData,
} from "@/lib/schemas/vault";

interface VaultFormProps {
  category: AssetCategory;
  record?: VaultRecord;
  onSubmit: (data: VaultRecordInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
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

export function VaultForm({
  category,
  record,
  onSubmit,
  onCancel,
  submitLabel,
}: VaultFormProps) {
  const config  = CATEGORY_CONFIG[category];
  const schema  = getCategorySchema(category);

  const defaultValues: VaultFormData = record
    ? {
        institutionName: record.institutionName,
        accountName:     record.accountName,
        usernameOrEmail: record.usernameOrEmail ?? "",
        accountUrl:      record.accountUrl ?? "",
        notes:           record.notes ?? "",
      }
    : config.defaultValues;

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VaultFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const notesValue = watch("notes") ?? "";

  const handleFormSubmit = async (values: VaultFormData) => {
    try {
      await onSubmit({
        category,
        institutionName: values.institutionName,
        accountName:     values.accountName,
        usernameOrEmail: values.usernameOrEmail || undefined,
        accountUrl:      values.accountUrl || undefined,
        notes:           values.notes || undefined,
      });
    } catch (err) {
      setError("root", {
        message: err instanceof ServiceError ? err.message : "Something went wrong",
      });
    }
  };

  const renderTextField = (
    field: "institutionName" | "usernameOrEmail" | "accountUrl",
    label: string,
    placeholder: string | undefined,
    required?: boolean
  ) => (
    <FormSection>
      <FieldLabel text={label} required={required} />
      <Input placeholder={placeholder} {...register(field)} />
      <FieldError message={errors[field]?.message} />
    </FormSection>
  );

  const renderSelectField = (
    field: "accountName" | "usernameOrEmail" | "accountUrl",
    label: string,
    options: readonly string[],
    required?: boolean
  ) => (
    <FormSection>
      <FieldLabel text={label} required={required} />
      <Select {...register(field)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </Select>
      <FieldError message={errors[field]?.message} />
    </FormSection>
  );

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      {/* institutionName */}
      {config.institutionName.type !== "hidden" &&
        renderTextField(
          "institutionName",
          config.institutionName.label,
          config.institutionName.placeholder,
          config.institutionName.required
        )}

      {/* accountName — text or select */}
      {config.accountName.type === "select"
        ? renderSelectField(
            "accountName",
            config.accountName.label,
            config.accountName.options!,
            config.accountName.required
          )
        : config.accountName.type !== "hidden" && (
            <FormSection>
              <FieldLabel text={config.accountName.label} required={config.accountName.required} />
              <Input placeholder={config.accountName.placeholder} {...register("accountName")} />
              <FieldError message={errors.accountName?.message} />
            </FormSection>
          )}

      {/* usernameOrEmail — text or select */}
      {config.usernameOrEmail.type === "select"
        ? renderSelectField(
            "usernameOrEmail",
            config.usernameOrEmail.label,
            config.usernameOrEmail.options!,
            config.usernameOrEmail.required
          )
        : config.usernameOrEmail.type !== "hidden" && (
            renderTextField(
              "usernameOrEmail",
              config.usernameOrEmail.label,
              config.usernameOrEmail.placeholder,
              config.usernameOrEmail.required
            )
          )}

      {/* accountUrl — text, url, or select */}
      {config.accountUrl.type === "select"
        ? renderSelectField(
            "accountUrl",
            config.accountUrl.label,
            config.accountUrl.options!,
            config.accountUrl.required
          )
        : config.accountUrl.type !== "hidden" && (
            renderTextField(
              "accountUrl",
              config.accountUrl.label,
              config.accountUrl.placeholder,
              config.accountUrl.required
            )
          )}

      {/* Crypto warning */}
      {config.showCryptoWarning && (
        <InfoBanner variant="info" className="mb-5">
          Do not store seed phrases or private keys in this vault. Record the
          wallet location and provider only. Your beneficiary can seek
          professional assistance to access the wallet.
        </InfoBanner>
      )}

      {/* Notes / instructions */}
      <FormSection divider>
        <FieldLabel text={config.notesLabel} required={config.notesRequired} />
        <Textarea
          placeholder={config.notesPlaceholder}
          rows={4}
          {...register("notes")}
        />
        <CharacterCounter value={notesValue} max={500} />
        <FieldError message={errors.notes?.message} />
      </FormSection>

      {/* Root error */}
      {errors.root && (
        <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
          {errors.root.message}
        </p>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-2 mt-2">
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {submitLabel ?? (record ? "Save changes →" : "Save asset →")}
        </Button>
        <Button type="button" variant="ghost" fullWidth onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
