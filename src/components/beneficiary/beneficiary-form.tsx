"use client";

import { useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { CharacterCounter } from "@/components/ui/character-counter";
import { BeneficiaryService } from "@/services/beneficiary.service";
import { ServiceError } from "@/lib/types";
import type { BeneficiaryInput, Relationship } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
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
  const currentEmail = useAuthStore((s) => s.user?.email ?? "");

  const [pending, setPending]   = useState<BeneficiaryInput | null>(null);
  const [checking, setChecking] = useState(false);
  const [sending, setSending]   = useState(false);
  const [notes, setNotes]       = useState("");
  const [sendError, setSendError] = useState("");

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
    const input: BeneficiaryInput = {
      name:         values.name,
      email:        values.email,
      relationship: values.relationship,
      isDefault:    values.isDefault,
    };

    // Edit flow — submit directly, no platform check needed.
    if (beneficiary) {
      try {
        await onSubmit(input);
      } catch (err) {
        setError("root", {
          message: err instanceof ServiceError ? err.message : "Something went wrong",
        });
      }
      return;
    }

    // New beneficiary — check if the email is already on the platform.
    setChecking(true);
    try {
      const { onPlatform } = await BeneficiaryService.checkEmail(input.email);
      if (onPlatform) {
        await onSubmit(input);
      } else {
        setPending(input);
      }
    } catch (err) {
      setError("root", {
        message: err instanceof ServiceError ? err.message : "Something went wrong",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSendInvite = async () => {
    if (!pending) return;
    setSending(true);
    setSendError("");
    try {
      await onSubmit({ ...pending, notes: notes.trim() || undefined });
    } catch (err) {
      setSendError(err instanceof ServiceError ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  // ── Confirmation step (off-platform new user) ──────────────────────────
  if (pending) {
    return (
      <div>
        <div className="flex items-start gap-3 bg-surface-2 border border-border-color rounded-xl px-4 py-3.5 mb-5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-accent flex items-center justify-center flex-shrink-0 mt-0.5">
            <Mail size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-[500] text-text-primary leading-snug">
              {pending.name} isn&apos;t on Anchora yet
            </p>
            <p className="text-[12px] text-text-tertiary mt-0.5 break-all">
              {pending.email}
            </p>
          </div>
        </div>

        <p className="text-[13px] text-text-secondary mb-4">
          We&apos;ll send them an invite so they can join Anchora and access this vault when the time comes.
        </p>

        <FormSection>
          <FieldLabel text="Add a personal note (optional)" />
          <Textarea
            placeholder={`e.g. "Hey ${pending.name.split(" ")[0]}, I've added you as a beneficiary on Anchora…"`}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <CharacterCounter value={notes} max={500} />
        </FormSection>

        {sendError && (
          <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
            {sendError}
          </p>
        )}

        <div className="flex flex-col gap-2 mt-2">
          <Button type="button" fullWidth onClick={handleSendInvite} disabled={sending || notes.length > 500}>
            {sending && <Loader2 size={15} className="animate-spin" />}
            Send invite →
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => { setPending(null); setNotes(""); setSendError(""); }}
            disabled={sending}
          >
            ← Back
          </Button>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <FormSection>
        <FieldLabel text="Full name" required />
        <Input placeholder="e.g. Jane Smith" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </FormSection>

      <FormSection>
        <FieldLabel text="Email address" required />
        <Input
          type="email"
          placeholder="e.g. jane@example.com"
          {...register("email", {
            validate: (v) =>
              v.trim().toLowerCase() !== currentEmail.toLowerCase() ||
              "You can't add yourself as a beneficiary",
          })}
        />
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

      <div className="flex items-center justify-between py-3 px-0 mt-1 mb-1">
        <div>
          <p className="text-[13px] font-[500] text-text-primary">Primary contact</p>
          <p className="text-[11.5px] text-text-tertiary">
            Only one beneficiary can be set as primary
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

      {errors.root && (
        <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
          {errors.root.message}
        </p>
      )}

      <div className="flex flex-col gap-2 mt-2">
        <Button type="submit" fullWidth disabled={isSubmitting || checking}>
          {(isSubmitting || checking) && <Loader2 size={15} className="animate-spin" />}
          {submitLabel ?? (beneficiary ? "Save changes →" : "Add beneficiary →")}
        </Button>
        <Button type="button" variant="ghost" fullWidth onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
