import {
  Landmark,
  TrendingUp,
  Bitcoin,
  Shield,
  FileText,
  Globe,
  CreditCard,
  Archive,
  Building2,
  Car,
  Gem,
  FileStack,
} from "lucide-react";
import type { AssetCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DIGITAL_ASSET_CATEGORIES, PHYSICAL_ASSET_CATEGORIES } from "@/lib/schemas/vault";

const iconMap: Record<AssetCategory, React.ElementType> = {
  BANK_ACCOUNT:        Landmark,
  INVESTMENT_PLATFORM: TrendingUp,
  CRYPTO_WALLET:       Bitcoin,
  PENSION_PORTAL:      Shield,
  INSURANCE_POLICY:    FileText,
  FOREIGN_ACCOUNT:     Globe,
  REAL_ESTATE:         Building2,
  VEHICLE:             Car,
  JEWELRY_WATCHES:     Gem,
  SHARE_CERTIFICATES:  FileStack,
  SUBSCRIPTION:        CreditCard,
  OTHER:               Archive,
};

// Colored by the same digital/physical grouping used across the app
// (see DIGITAL_ASSET_CATEGORIES / PHYSICAL_ASSET_CATEGORIES) rather than a
// unique hue per category — icon shape carries per-category recognition,
// color carries the broader grouping.
const colorMap: Record<AssetCategory, string> = {
  ...Object.fromEntries(
    DIGITAL_ASSET_CATEGORIES.map((c) => [c, "bg-accent-light text-accent"])
  ),
  ...Object.fromEntries(
    PHYSICAL_ASSET_CATEGORIES.map((c) => [c, "bg-gold-light text-gold"])
  ),
  SUBSCRIPTION: "bg-surface-2 text-text-secondary",
  OTHER:        "bg-surface-2 text-text-secondary",
} as Record<AssetCategory, string>;

interface CategoryIconProps {
  category: AssetCategory;
  size?: number;
  className?: string;
  solid?: boolean;
}

export function CategoryIcon({ category, size = 16, className, solid }: CategoryIconProps) {
  const Icon = iconMap[category];
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0",
        solid ? "bg-green text-white" : colorMap[category],
        className
      )}
    >
      <Icon size={size} />
    </div>
  );
}

export const categoryLabels: Record<AssetCategory, string> = {
  BANK_ACCOUNT:        "Bank Account",
  INVESTMENT_PLATFORM: "Investment Platform",
  CRYPTO_WALLET:       "Crypto Wallet",
  PENSION_PORTAL:      "Pension Portal",
  INSURANCE_POLICY:    "Insurance Policy",
  FOREIGN_ACCOUNT:     "Foreign Account",
  REAL_ESTATE:         "Real Estate",
  VEHICLE:             "Vehicle",
  JEWELRY_WATCHES:     "Jewelry & Watches",
  SHARE_CERTIFICATES:  "Share Certificates",
  SUBSCRIPTION:        "Subscriptions",
  OTHER:               "Other",
};
