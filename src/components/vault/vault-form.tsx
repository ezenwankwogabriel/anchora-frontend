"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";

// Zod v4 sets Input=unknown on ZodType<T>, breaking zodResolver's overload.
const zodResolver = _zodResolver as unknown as (
  schema: ReturnType<typeof getCategorySchema>
) => Resolver<VaultFormData>;

import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { InfoBanner } from "@/components/ui/info-banner";
import { CharacterCounter } from "@/components/ui/character-counter";
import { VaultDocumentSection } from "./vault-document-section";
import { VaultDocumentPicker } from "./vault-document-picker";
import { ServiceError } from "@/lib/types";
import type { VaultRecord, VaultRecordInput, AssetCategory } from "@/lib/types";
import {
  getCategorySchema,
  getFieldConfig,
  CATEGORY_DEFAULTS,
  type VaultFormData,
  type FieldConfig,
} from "@/lib/schemas/vault";

const INTENT_OPTIONS = [
  { value: "UNSPECIFIED", label: "Not specified" },
  { value: "LIQUIDATE",   label: "Liquidate and distribute" },
  { value: "TRANSFER",    label: "Transfer to intended person" },
  { value: "HOLD",        label: "Hold until further instruction" },
] as const;

interface VaultFormProps {
  category: AssetCategory;
  record?: VaultRecord;
  onSubmit: (data: VaultRecordInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  hideCancel?: boolean;
  stagedFiles: File[];
  onStagedFilesChange: (files: File[]) => void;
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

function HelperText({ text }: { text: string }) {
  return <p className="text-[11.5px] text-text-tertiary mt-[5px]">{text}</p>;
}

export function VaultForm({
  category,
  record,
  onSubmit,
  onCancel,
  submitLabel,
  hideCancel,
  stagedFiles,
  onStagedFilesChange,
}: VaultFormProps) {
  const schema = getCategorySchema(category);
  const { fields } = getFieldConfig(category);

  const defaultValues: VaultFormData = record
    ? {
        institutionName:     record.institutionName,
        accountName:         record.accountName ?? "",
        referenceId:         record.encryptedFields?.referenceId ?? "",
        credential:          record.encryptedFields?.credential ?? "",
        accountUrl:          record.accountUrl ?? "",
        notes:               record.encryptedFields?.notes ?? "",
        executorIntent:      record.executorIntent ?? "UNSPECIFIED",
        intendedBeneficiary: record.intendedBeneficiary ?? "",
        isSelfCustodied:     record.isSelfCustodied ?? false,
      }
    : CATEGORY_DEFAULTS[category];

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VaultFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const isSelfCustodied = watch("isSelfCustodied");
  const notesValue      = watch("notes") ?? "";

  const handleFormSubmit = async (values: VaultFormData) => {
    try {
      await onSubmit({
        category,
        institutionName:     values.institutionName,
        accountName:         values.accountName         || undefined,
        credential:          values.credential          || undefined,
        referenceId:         values.referenceId         || undefined,
        accountUrl:          values.accountUrl          || undefined,
        notes:               values.notes               || undefined,
        executorIntent:      values.executorIntent,
        intendedBeneficiary: values.intendedBeneficiary || undefined,
        isSelfCustodied:     values.isSelfCustodied,
      });
    } catch (err) {
      setError("root", {
        message: err instanceof ServiceError ? err.message : "Something went wrong",
      });
    }
  };

  const renderField = (field: FieldConfig) => {
    const key = field.fieldName;
    const error = errors[key as keyof typeof errors]?.message as string | undefined;

    if (field.type === "checkbox") {
      return (
        <FormSection key={key}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-[3px] h-4 w-4 rounded border-border-color text-accent focus:ring-accent accent-accent"
              checked={isSelfCustodied}
              onChange={(e) => setValue("isSelfCustodied", e.target.checked)}
            />
            <div>
              <p className="text-[13px] font-[500] text-text-primary leading-tight">
                {field.label}
              </p>
              {field.helperText && <HelperText text={field.helperText} />}
            </div>
          </label>

          {isSelfCustodied && (
            <InfoBanner variant="warning" className="mt-3">
              Private key location is critical. Use the notes field to describe exactly
              where your seed phrase or hardware wallet is stored.
            </InfoBanner>
          )}
        </FormSection>
      );
    }

    if (field.type === "textarea") {
      return (
        <FormSection key={key}>
          <FieldLabel text={field.label} required={field.required} />
          <Textarea
            placeholder={field.placeholder}
            rows={4}
            {...register("notes")}
          />
          <CharacterCounter value={notesValue} max={500} />
          {field.helperText && <HelperText text={field.helperText} />}
          <FieldError message={error} />
        </FormSection>
      );
    }

    // Default: text input
    const textField = key as "institutionName" | "accountName" | "credential" | "referenceId";
    return (
      <FormSection key={key}>
        <FieldLabel text={field.label} required={field.required} />
        <Input placeholder={field.placeholder} {...register(textField)} />
        {field.helperText && <HelperText text={field.helperText} />}
        <FieldError message={error} />
      </FormSection>
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      {fields.map(renderField)}

      {/* ── Estate intent fields ─────────────────────────────────────── */}
      <FormSection divider>
        <FieldLabel text="Who should receive this asset?" />
        <Input
          placeholder="e.g. Amaka, my eldest daughter"
          {...register("intendedBeneficiary")}
        />
        <HelperText text="A note for your executor — not a legal instruction." />
        <FieldError message={errors.intendedBeneficiary?.message} />
      </FormSection>

      <FormSection>
        <FieldLabel text="What should happen to this asset?" />
        <Select {...register("executorIntent")}>
          {INTENT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
        <FieldError message={errors.executorIntent?.message} />
      </FormSection>

      {record ? (
        <VaultDocumentSection
          recordId={record.id}
          stagedFiles={stagedFiles}
          onStagedFilesChange={onStagedFilesChange}
          documentUrl={watch("accountUrl")}
          onDocumentUrlChange={(url) => setValue("accountUrl", url)}
        />
      ) : (
        <VaultDocumentPicker files={stagedFiles} onChange={onStagedFilesChange} />
      )}

      {errors.root && (
        <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
          {errors.root.message}
        </p>
      )}

      <div className="flex flex-col gap-2 mt-8">
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {submitLabel ?? (record ? "Save changes →" : "Save asset →")}
        </Button>
        {!hideCancel && (
          <Button type="button" variant="ghost" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
