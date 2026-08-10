"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";

// Zod v4 sets Input=unknown on ZodType<T>, breaking zodResolver's overload.
const zodResolver = _zodResolver as unknown as (
  schema: ReturnType<typeof getCategorySchema>,
) => Resolver<VaultFormData>;

import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { koboToNaira, parseNairaInputToKobo } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
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

type FieldTone = "required" | "optional" | "guidance";

interface FieldLabelProps {
  text: string;
  required?: boolean;
  tone: FieldTone;
}

function FieldLabel({ text, required, tone }: FieldLabelProps) {
  return (
    <label
      className={cn(
        "block text-[13px] mb-[6px]",
        tone === "required" && "font-medium text-text-primary",
        tone === "optional" && "font-normal text-text-secondary",
        tone === "guidance" && "font-normal text-text-primary",
      )}
    >
      {text}
      {required && " *"}
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

// Fields that always sit in the core, always-visible section regardless of
// category.
const ALWAYS_CORE_FIELDS = new Set<keyof VaultFormData>([
  "institutionName",
  "accountName",
  "credential",
  "referenceId",
  "accountType",
  "isSelfCustodied",
  "notes",
  "estimatedValue",
]);

function isCoreField(field: FieldConfig): boolean {
  return ALWAYS_CORE_FIELDS.has(field.fieldName);
}

// The "Add more details" section starts expanded on an existing record only
// if it already has something worth showing in it.
function hasExistingAdvancedValues(record?: VaultRecord): boolean {
  if (!record) return false;
  return Boolean(
    record.encryptedFields?.credential?.trim() ||
    record.intendedBeneficiary?.trim() ||
    record.accountUrl?.trim() ||
    record.isSelfCustodied,
  );
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
        institutionName: record.institutionName,
        accountName: record.accountName ?? "",
        referenceId: record.encryptedFields?.referenceId ?? "",
        credential: record.encryptedFields?.credential ?? "",
        accountUrl: record.accountUrl ?? "",
        notes: record.encryptedFields?.notes ?? "",
        executorIntent: record.executorIntent ?? "UNSPECIFIED",
        intendedBeneficiary: record.intendedBeneficiary ?? "",
        isSelfCustodied: record.isSelfCustodied ?? false,
        accountType: record.encryptedFields?.accountType ?? "",
        estimatedValue:
          record.estimatedValue != null ? String(koboToNaira(record.estimatedValue)) : "",
      }
    : CATEGORY_DEFAULTS[category];

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<VaultFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const [detailsOpen, setDetailsOpen] = useState(() =>
    hasExistingAdvancedValues(record),
  );

  const isSelfCustodied = watch("isSelfCustodied");
  const notesValue = watch("notes") ?? "";

  const handleFormSubmit = async (values: VaultFormData) => {
    try {
      await onSubmit({
        category,
        institutionName: values.institutionName,
        accountName: values.accountName || undefined,
        credential: values.credential || undefined,
        referenceId: values.referenceId || undefined,
        accountUrl: values.accountUrl || undefined,
        notes: values.notes || undefined,
        executorIntent: values.executorIntent,
        intendedBeneficiary: values.intendedBeneficiary || undefined,
        isSelfCustodied: values.isSelfCustodied,
        accountType: values.accountType || undefined,
        estimatedValue: values.estimatedValue
          ? parseNairaInputToKobo(values.estimatedValue)
          : record?.estimatedValue != null
            ? null
            : undefined,
      });
    } catch (err) {
      setError("root", {
        message:
          err instanceof ServiceError ? err.message : "Something went wrong",
      });
    }
  };

  const renderField = (field: FieldConfig, tone: FieldTone) => {
    const key = field.fieldName;
    const error = errors[key as keyof typeof errors]?.message as
      | string
      | undefined;

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
              Private key location is critical. Use the notes field to describe
              exactly where your seed phrase or hardware wallet is stored.
            </InfoBanner>
          )}
        </FormSection>
      );
    }

    if (field.type === "textarea") {
      return (
        <FormSection key={key}>
          <FieldLabel
            text={field.label}
            required={field.required}
            tone={tone}
          />
          {getValues("notes") !== "" && field.placeholder && (
            <p className="text-[11.5px] text-text-tertiary mb-[6px] leading-snug">
              {field.placeholder}
            </p>
          )}
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

    if (field.type === "currency") {
      return (
        <FormSection key={key}>
          <FieldLabel text={field.label} required={field.required} tone={tone} />
          <CurrencyInput
            name="estimatedValue"
            placeholder={field.placeholder ?? "0.00"}
            value={watch("estimatedValue") ?? ""}
            onChange={(v) => setValue("estimatedValue", v)}
          />
          {field.helperText && <HelperText text={field.helperText} />}
          <FieldError message={error} />
        </FormSection>
      );
    }

    if (field.type === "select") {
      const selectField = key as "accountType";
      return (
        <FormSection key={key}>
          <FieldLabel text={field.label} required={field.required} tone={tone} />
          <Select {...register(selectField)}>
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          {field.helperText && <HelperText text={field.helperText} />}
          <FieldError message={error} />
        </FormSection>
      );
    }

    // Default: text input
    const textField = key as
      | "institutionName"
      | "accountName"
      | "credential"
      | "referenceId";
    return (
      <FormSection key={key}>
        <FieldLabel text={field.label} required={field.required} tone={tone} />
        <Input placeholder={field.placeholder} {...register(textField)} />
        {field.helperText && <HelperText text={field.helperText} />}
        <FieldError message={error} />
      </FormSection>
    );
  };

  const coreFields = fields.filter((f) => isCoreField(f));
  const advancedFields = fields.filter((f) => !isCoreField(f));

  const handleDocumentsLoaded = (hasDocuments: boolean) => {
    if (hasDocuments) setDetailsOpen(true);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <div className="bg-surface border border-border-color rounded-lg p-4 mb-3 [&>*:last-child]:mb-0">
        {coreFields.map((f) =>
          renderField(f, f.required ? "required" : "optional"),
        )}
      </div>

      <button
        type="button"
        onClick={() => setDetailsOpen((open) => !open)}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-accent cursor-pointer bg-transparent border-none px-0 py-2 mb-2 font-sans"
      >
        {detailsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        {detailsOpen ? "Hide more details" : "Add more details"}
      </button>

      {detailsOpen && advancedFields.length > 0 && (
        <div className="bg-surface border border-border-color rounded-lg p-4 mb-3 [&>*:last-child]:mb-0">
          {advancedFields.map((f) => renderField(f, "guidance"))}
        </div>
      )}

      {record ? (
        <div className={detailsOpen ? undefined : "hidden"}>
          <VaultDocumentSection
            recordId={record.id}
            stagedFiles={stagedFiles}
            onStagedFilesChange={onStagedFilesChange}
            documentUrl={watch("accountUrl")}
            onDocumentUrlChange={(url) => setValue("accountUrl", url)}
            onDocumentsLoaded={handleDocumentsLoaded}
          />
        </div>
      ) : (
        <div className={detailsOpen ? undefined : "hidden"}>
          <VaultDocumentPicker
            files={stagedFiles}
            onChange={onStagedFilesChange}
            accented
          />
        </div>
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
