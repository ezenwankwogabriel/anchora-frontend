"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StepIndicator } from "@/components/ui/step-indicator";
import { CategorySelector } from "@/components/ui/category-selector";
import { CategoryIcon, categoryLabels } from "@/components/ui/category-icon";
import { VaultForm } from "@/components/vault/vault-form";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { VaultService } from "@/services/vault.service";
import { usePlan } from "@/hooks/usePlan";
import { useToastStore } from "@/stores/toastStore";
import type { AssetCategory, VaultRecordInput } from "@/lib/types";

const FREE_RECORD_LIMIT = 3;

const VALID_CATEGORIES = new Set<string>([
  "BANK_ACCOUNT", "INVESTMENT_PLATFORM", "CRYPTO_WALLET",
  "PENSION_PORTAL", "INSURANCE_POLICY", "FOREIGN_ACCOUNT",
  "REAL_ESTATE", "VEHICLE", "JEWELRY_WATCHES", "SHARE_CERTIFICATES",
  "OTHER",
]);

const STEP_LABELS = ["Select type", "Enter details"] as const;

interface AddAssetClientProps {
  initialCategory?: string;
}

export function AddAssetClient({ initialCategory, recordCount }: AddAssetClientProps & { recordCount?: number }) {
  const router   = useRouter();
  const addToast = useToastStore((s) => s.add);
  const { isFree, loading: planLoading } = usePlan();

  const [step, setStep]         = useState<0 | 1>(0);
  const [category, setCategory] = useState<AssetCategory | null>(null);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const atLimit = isFree && (recordCount ?? 0) >= FREE_RECORD_LIMIT;

  useEffect(() => {
    if (initialCategory && VALID_CATEGORIES.has(initialCategory)) {
      setCategory(initialCategory as AssetCategory);
      setStep(1);
    }
  }, [initialCategory]);

  const handleContinue = () => {
    if (category) setStep(1);
  };

  const handleBack = () => {
    if (step === 1) setStep(0);
  };

  const handleSubmit = async (data: VaultRecordInput) => {
    const record = await VaultService.createRecord(data);

    if (record && stagedFiles.length > 0) {
      const results = await Promise.allSettled(
        stagedFiles.map((file) => VaultService.uploadDocument(record.id, file)),
      );
      const failedCount = results.filter((r) => r.status === "rejected").length;

      if (failedCount > 0) {
        addToast(
          `Asset saved, but ${failedCount} document${failedCount === 1 ? "" : "s"} failed to upload. You can retry from the asset page.`,
          "error",
        );
      } else {
        addToast("Asset and documents saved.", "success");
      }
    } else {
      addToast("Asset saved to your vault.", "success");
    }

    router.push("/vault");
  };

  if (!planLoading && atLimit) {
    return (
      <div className="max-w-[600px] mx-auto pt-8">
        <Link
          href="/vault"
          className="inline-flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back to vault
        </Link>
        <UpgradePrompt
          feature="Unlimited asset records"
          description="Free plan includes up to 3 records. Upgrade to Pro to add unlimited assets across all categories."
        />
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto">
        {/* Back navigation */}
        <div className="mb-6">
          {step === 0 ? (
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={15} />
              Back to vault
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer font-sans"
            >
              <ArrowLeft size={15} />
              Back
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="mb-2">
          <StepIndicator steps={2} current={step} />
        </div>
        <div className="flex justify-between mb-6">
          {STEP_LABELS.map((label, i) => (
            <span
              key={label}
              className={`text-[11.5px] font-semibold ${
                i < step ? "text-green" : i === step ? "text-accent" : "text-text-tertiary"
              }`}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Step 0 — category picker */}
        {step === 0 && (
          <>
            <h1 className="font-heading text-[26px] text-text-primary mb-2">
              What type of asset?
            </h1>
            <p className="text-[13.5px] text-text-secondary mb-6">
              Select the category that best describes the account you&apos;re registering.
            </p>

            <CategorySelector value={category} onChange={setCategory} />

            <div className="mt-6">
              <Button fullWidth disabled={!category} onClick={handleContinue}>
                Continue →
              </Button>
            </div>
          </>
        )}

        {/* Step 1 — asset details */}
        {category && step === 1 && (
          <div>
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border-color">
              <CategoryIcon category={category} size={16} />
              <div>
                <p className="text-[13px] font-semibold text-text-primary">
                  {categoryLabels[category]}
                </p>
                <p className="text-[11.5px] text-text-tertiary">Fill in the details below</p>
              </div>
            </div>

            <VaultForm
              category={category}
              onSubmit={handleSubmit}
              onCancel={() => router.push("/vault")}
              hideCancel
              stagedFiles={stagedFiles}
              onStagedFilesChange={setStagedFiles}
            />
          </div>
        )}
    </div>
  );
}
