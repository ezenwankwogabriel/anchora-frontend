"use client";

import type { AssetCategory } from "@/lib/types";
import { CategoryIcon, categoryLabels } from "./category-icon";
import { cn } from "@/lib/utils";

const categoryExamples: Record<AssetCategory, string> = {
  BANK_ACCOUNT:         "GTB, Zenith, Access...",
  INVESTMENT_PLATFORM:  "Bamboo, Risevest, PiggyVest...",
  CRYPTO_WALLET:        "Hardware, exchange, software...",
  PENSION_PORTAL:       "ARM, NLPC, Stanbic...",
  INSURANCE_POLICY:     "Life, health, auto, property...",
  FOREIGN_ACCOUNT:      "UK ISA, US brokerage, diaspora...",
  OTHER:                "Anything not listed above",
};

const CATEGORIES: AssetCategory[] = [
  "BANK_ACCOUNT",
  "INVESTMENT_PLATFORM",
  "CRYPTO_WALLET",
  "PENSION_PORTAL",
  "INSURANCE_POLICY",
  "FOREIGN_ACCOUNT",
  "OTHER",
];

interface CategorySelectorProps {
  value: AssetCategory | null;
  onChange: (category: AssetCategory) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CATEGORIES.map((cat) => {
        const selected = value === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={cn(
              "flex items-center gap-[14px] px-[16px] py-[14px] border-[1.5px] rounded-xl text-left transition-all",
              selected
                ? "border-accent bg-accent-light"
                : "border-border-color hover:border-accent hover:bg-surface-2"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0 transition-colors",
              selected ? "bg-accent-light" : "bg-surface-2"
            )}>
              <CategoryIcon category={cat} size={16} className="w-auto h-auto bg-transparent rounded-none" />
            </div>
            <div className="min-w-0">
              <p className={cn(
                "text-[13px] font-semibold truncate",
                selected ? "text-accent" : "text-text-primary"
              )}>
                {categoryLabels[cat]}
              </p>
              <p className="text-[11.5px] text-text-tertiary mt-[2px] truncate">
                {categoryExamples[cat]}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
