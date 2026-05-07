"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { StepIndicator } from "@/components/ui/step-indicator";
import { CategorySelector } from "@/components/ui/category-selector";
import { CategoryIcon, categoryLabels } from "@/components/ui/category-icon";
import { VaultForm } from "@/components/vault/vault-form";
import { Button } from "@/components/ui/button";
import { VaultService } from "@/services/vault.service";
import { useToastStore } from "@/stores/toastStore";
import type { AssetCategory, VaultRecordInput } from "@/lib/types";

const VALID_CATEGORIES = new Set<string>([
  "BANK_ACCOUNT", "INVESTMENT_PLATFORM", "CRYPTO_WALLET",
  "PENSION_PORTAL", "INSURANCE_POLICY", "FOREIGN_ACCOUNT", "OTHER",
]);

interface AddAssetClientProps {
  initialCategory?: string;
}

export function AddAssetClient({ initialCategory }: AddAssetClientProps) {
  const router   = useRouter();
  const addToast = useToastStore((s) => s.add);

  const [step, setStep]         = useState<0 | 1>(0);
  const [category, setCategory] = useState<AssetCategory | null>(null);

  // Pre-select and auto-advance when arriving with ?category=...
  useEffect(() => {
    if (initialCategory && VALID_CATEGORIES.has(initialCategory)) {
      setCategory(initialCategory as AssetCategory);
      setStep(1);
    }
  }, [initialCategory]);

  const handleContinue = () => {
    if (category) setStep(1);
  };

  const handleBack = () => setStep(0);

  const handleSubmit = async (data: VaultRecordInput) => {
    await VaultService.createRecord(data);
    addToast("Asset saved to your vault.", "success");
    router.push("/dashboard");
  };

  return (
    <AppLayout>
      <div className="max-w-[600px] mx-auto">
        {/* Back arrow */}
        <div className="mb-6">
          {step === 0 ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={15} />
              Back to dashboard
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
          <span className={`text-[11.5px] font-semibold ${step === 0 ? "text-accent" : "text-green"}`}>
            Select type
          </span>
          <span className={`text-[11.5px] font-semibold ${step === 1 ? "text-accent" : "text-text-tertiary"}`}>
            Enter details
          </span>
        </div>

        {step === 0 ? (
          <>
            <h1 className="font-heading text-[26px] text-text-primary mb-2">
              What type of asset?
            </h1>
            <p className="text-[13.5px] text-text-secondary mb-6">
              Select the category that best describes the account you&apos;re registering.
            </p>

            <CategorySelector value={category} onChange={setCategory} />

            <div className="mt-6">
              <Button
                fullWidth
                disabled={!category}
                onClick={handleContinue}
              >
                Continue →
              </Button>
            </div>
          </>
        ) : category ? (
          <>
            {/* Category badge */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border-color">
              <CategoryIcon category={category} size={16} />
              <div>
                <p className="text-[13px] font-semibold text-text-primary">
                  {categoryLabels[category]}
                </p>
                <p className="text-[11.5px] text-text-tertiary">
                  Fill in the details below
                </p>
              </div>
            </div>

            <VaultForm
              category={category}
              onSubmit={handleSubmit}
              onCancel={() => router.push("/dashboard")}
            />
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
