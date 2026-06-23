"use client";

import type { AssetCategory } from "@/lib/types";
import { DIGITAL_ASSET_CATEGORIES, PHYSICAL_ASSET_CATEGORIES } from "@/lib/schemas/vault";
import { CategoryIcon, categoryLabels } from "./category-icon";
import { cn } from "@/lib/utils";

const categoryExamples: Record<AssetCategory, string> = {
  BANK_ACCOUNT:        "GTB, Zenith, Access...",
  INVESTMENT_PLATFORM: "Bamboo, Risevest, PiggyVest...",
  CRYPTO_WALLET:       "Hardware wallet, Binance...",
  PENSION_PORTAL:      "ARM, NLPC, Stanbic...",
  INSURANCE_POLICY:    "Life, health, auto, property...",
  FOREIGN_ACCOUNT:     "UK ISA, US brokerage...",
  REAL_ESTATE:         "Land, property, duplex...",
  VEHICLE:             "Car, truck, motorcycle...",
  JEWELRY_WATCHES:     "Rings, watches, gold...",
  SHARE_CERTIFICATES:  "Paper share certs, bonds...",
  SUBSCRIPTION:        "Netflix, Spotify, SaaS tools...",
  OTHER:               "Anything not listed above",
};


interface CategorySelectorProps {
  value: AssetCategory | null;
  onChange: (category: AssetCategory) => void;
}

function CategoryCard({
  category,
  selected,
  onClick,
}: {
  category: AssetCategory;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-[14px] px-[16px] py-[14px] border-[1.5px] rounded-xl text-left transition-all",
        selected
          ? "border-accent bg-[#EFF6FF]"
          : "border-border-color hover:border-accent hover:bg-surface-2"
      )}
    >
      <div className={cn(
        "w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0 transition-colors",
        selected ? "bg-[#EFF6FF]" : "bg-surface-2"
      )}>
        <CategoryIcon category={category} size={16} className="w-auto h-auto bg-transparent rounded-none" />
      </div>
      <div className="min-w-0">
        <p className={cn(
          "text-[13px] font-semibold truncate",
          selected ? "text-accent" : "text-text-primary"
        )}>
          {categoryLabels[category]}
        </p>
        <p className="text-[11.5px] text-text-tertiary mt-[2px] truncate">
          {categoryExamples[category]}
        </p>
      </div>
    </button>
  );
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <div className="space-y-6">
      {/* Section 1 — Financial & Digital */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-text-tertiary mb-3">
          Financial &amp; Digital Accounts
        </p>
        <div className="grid grid-cols-2 gap-3">
          {DIGITAL_ASSET_CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat}
              category={cat}
              selected={value === cat}
              onClick={() => onChange(cat)}
            />
          ))}
        </div>
      </div>

      {/* Section 2 — Physical Assets */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-text-tertiary mb-3">
          Physical Assets
        </p>
        <div className="grid grid-cols-2 gap-3">
          {PHYSICAL_ASSET_CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat}
              category={cat}
              selected={value === cat}
              onClick={() => onChange(cat)}
            />
          ))}
        </div>
      </div>

      {/* Section 3 — Other */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-text-tertiary mb-3">
          Other
        </p>
        <div className="grid grid-cols-2 gap-3">
          <CategoryCard
            category="OTHER"
            selected={value === "OTHER"}
            onClick={() => onChange("OTHER")}
          />
        </div>
      </div>
    </div>
  );
}
