"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";

// Zod v4 sets Input=unknown on ZodType<T>, breaking zodResolver's overload.
// Casting the resolver function itself (not the schema) avoids the mismatch
// without using `any`.
const zodResolver = _zodResolver as unknown as (
  schema: ReturnType<typeof getCategorySchema>
) => Resolver<VaultFormData>;
import { Loader2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { CharacterCounter } from "@/components/ui/character-counter";
import { ServiceError } from "@/lib/types";
import type { VaultRecord, VaultRecordInput, AssetCategory } from "@/lib/types";
import {
  getCategorySchema,
  CATEGORY_CONFIG,
  type VaultFormData,
} from "@/lib/schemas/vault";

const INTENT_OPTIONS = [
  { value: "UNSPECIFIED", label: "Not specified" },
  { value: "LIQUIDATE",   label: "Liquidate and distribute" },
  { value: "TRANSFER",    label: "Transfer to intended person" },
  { value: "HOLD",        label: "Hold" },
] as const;

interface VaultFormProps {
  category: AssetCategory;
  record?: VaultRecord;
  onSubmit: (data: VaultRecordInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  hideCancel?: boolean;
  children?: React.ReactNode;
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
  hideCancel,
  children,
}: VaultFormProps) {
  const config = CATEGORY_CONFIG[category];
  const schema = getCategorySchema(category);

  // Map from VaultRecord (API shape) back to VaultFormData (form shape).
  // OTHER: nickname = asset label (primary), institutionName = institution (secondary).
  // All others: accountName = institution (primary), nickname = user label.
  const defaultValues: VaultFormData = record
    ? {
        institutionName:     category === "OTHER" ? (record.nickname ?? "") : record.accountName,
        accountType:         record.accountType ?? "",
        nickname:            category === "OTHER" ? record.accountName : (record.nickname ?? ""),
        holderName:          record.encryptedFields?.holderName ?? "",
        accountNumber:       record.encryptedFields?.accountNumber ?? "",
        usernameOrEmail:     record.encryptedFields?.usernameOrEmail ?? "",
        password:            record.encryptedFields?.password ?? "",
        cardPin:             record.encryptedFields?.cardPin ?? "",
        notes:               record.encryptedFields?.notes ?? "",
        executorIntent:      record.executorIntent ?? "UNSPECIFIED",
        intendedBeneficiary: record.intendedBeneficiary ?? "",
        isSelfCustodied:     record.isSelfCustodied ?? false,
        recoveryNotes:       record.recoveryNotes ?? "",
      }
    : config.defaultValues;

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

  const notesValue       = watch("notes") ?? "";
  const isSelfCustodied  = watch("isSelfCustodied");

  const handleFormSubmit = async (values: VaultFormData) => {
    try {
      await onSubmit({
        category,
        institutionName:     values.institutionName,
        accountType:         values.accountType,
        nickname:            values.nickname,
        holderName:          values.holderName      || undefined,
        accountNumber:       values.accountNumber   || undefined,
        usernameOrEmail:     values.usernameOrEmail || undefined,
        password:            values.password        || undefined,
        cardPin:             values.cardPin         || undefined,
        notes:               values.notes           || undefined,
        executorIntent:      values.executorIntent,
        intendedBeneficiary: values.intendedBeneficiary || undefined,
        isSelfCustodied:     values.isSelfCustodied,
        recoveryNotes:       category === "CRYPTO_WALLET" && values.isSelfCustodied
                               ? (values.recoveryNotes || undefined)
                               : undefined,
      });
    } catch (err) {
      setError("root", {
        message: err instanceof ServiceError ? err.message : "Something went wrong",
      });
    }
  };

  const renderTextField = (
    field: "institutionName" | "nickname" | "holderName" | "accountNumber" | "usernameOrEmail" | "password" | "cardPin",
    label: string,
    placeholder: string | undefined,
    required?: boolean,
  ) => (
    <FormSection>
      <FieldLabel text={label} required={required} />
      <Input placeholder={placeholder} {...register(field)} />
      <FieldError message={errors[field]?.message} />
    </FormSection>
  );

  const renderPasswordField = (
    field: "password" | "cardPin",
    label: string,
    placeholder: string | undefined,
    required?: boolean,
  ) => (
    <FormSection>
      <FieldLabel text={label} required={required} />
      <PasswordInput placeholder={placeholder} {...register(field)} />
      <FieldError message={errors[field]?.message} />
    </FormSection>
  );

  const renderSelectField = (
    field: "accountType",
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

      {/* accountType — select or hidden */}
      {config.accountType.type === "select" &&
        renderSelectField(
          "accountType",
          config.accountType.label,
          config.accountType.options!,
          config.accountType.required
        )}

      {/* nickname */}
      {config.nickname.type !== "hidden" &&
        renderTextField(
          "nickname",
          config.nickname.label,
          config.nickname.placeholder,
          config.nickname.required
        )}

      {/* holderName */}
      {config.holderName.type !== "hidden" &&
        renderTextField(
          "holderName",
          config.holderName.label,
          config.holderName.placeholder,
          config.holderName.required
        )}

      {/* accountNumber */}
      {config.accountNumber.type !== "hidden" &&
        renderTextField(
          "accountNumber",
          config.accountNumber.label,
          config.accountNumber.placeholder,
          config.accountNumber.required
        )}

      {/* usernameOrEmail */}
      {config.usernameOrEmail.type !== "hidden" &&
        renderTextField(
          "usernameOrEmail",
          config.usernameOrEmail.label,
          config.usernameOrEmail.placeholder,
          config.usernameOrEmail.required
        )}

      {/* password */}
      {config.password.type !== "hidden" &&
        renderPasswordField(
          "password",
          config.password.label,
          config.password.placeholder,
          config.password.required,
        )}

      {/* cardPin */}
      {config.cardPin.type !== "hidden" &&
        renderPasswordField(
          "cardPin",
          config.cardPin.label,
          config.cardPin.placeholder,
          config.cardPin.required,
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

      {/* ── Executor intent fields ──────────────────────────────────────── */}
      <FormSection divider>
        <FieldLabel text="What should happen to this asset?" />
        <Select {...register("executorIntent")}>
          {INTENT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
        <FieldError message={errors.executorIntent?.message} />
      </FormSection>

      <FormSection>
        <FieldLabel text="Who should receive this asset?" />
        <Input
          placeholder="e.g. My wife Sarah, eldest son"
          {...register("intendedBeneficiary")}
        />
        <p className="text-[11.5px] text-text-tertiary mt-[5px]">
          Your stated intent for your executor — not a binding legal instruction.
        </p>
        <FieldError message={errors.intendedBeneficiary?.message} />
      </FormSection>

      {/* Self-custodied toggle — CRYPTO_WALLET only */}
      {category === "CRYPTO_WALLET" && (
        <FormSection>
          <div className="flex items-start gap-3">
            <Switch
              checked={isSelfCustodied}
              onCheckedChange={(v) => setValue("isSelfCustodied", v)}
            />
            <div>
              <p className="text-[13px] font-[500] text-text-primary leading-tight">
                This is a self-custodied wallet
              </p>
              <p className="text-[11.5px] text-text-tertiary mt-[3px]">
                e.g. MetaMask, hardware wallet, paper wallet. Not an exchange account.
              </p>
            </div>
          </div>
        </FormSection>
      )}

      {/* Recovery notes — CRYPTO_WALLET + isSelfCustodied only */}
      {category === "CRYPTO_WALLET" && isSelfCustodied && (
        <FormSection>
          {/* Amber callout */}
          <div className="flex items-start gap-2 bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-3 mb-3">
            <AlertTriangle size={15} className="text-[#D97706] flex-shrink-0 mt-[1px]" />
            <p className="text-[12.5px] text-[#92400E] leading-snug">
              Do not store your actual seed phrase here. Record where it can be found —
              not the phrase itself.
            </p>
          </div>
          <FieldLabel text="Where is the recovery information stored?" />
          <Textarea
            placeholder="e.g. Seed phrase is in the envelope marked 'crypto' in the safe in my study."
            rows={3}
            {...register("recoveryNotes")}
          />
          <FieldError message={errors.recoveryNotes?.message} />
        </FormSection>
      )}

      {children}

      {/* Root error */}
      {errors.root && (
        <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
          {errors.root.message}
        </p>
      )}

      {/* Buttons */}
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
