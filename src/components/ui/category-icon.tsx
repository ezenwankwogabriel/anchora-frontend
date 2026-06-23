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

const colorMap: Record<AssetCategory, string> = {
  BANK_ACCOUNT:        "bg-[#EBF1FD] text-accent",
  INVESTMENT_PLATFORM: "bg-[#E8F8EF] text-green",
  CRYPTO_WALLET:       "bg-[#FEF6E7] text-amber",
  PENSION_PORTAL:      "bg-[#EBF1FD] text-navy",
  INSURANCE_POLICY:    "bg-[#F0EDFC] text-[#6B4EE6]",
  FOREIGN_ACCOUNT:     "bg-[#E8F8EF] text-green",
  REAL_ESTATE:         "bg-[#F0FDF4] text-emerald-600",
  VEHICLE:             "bg-[#FFF7ED] text-orange-500",
  JEWELRY_WATCHES:     "bg-[#FDF4FF] text-purple-500",
  SHARE_CERTIFICATES:  "bg-[#EFF6FF] text-blue-600",
  SUBSCRIPTION:        "bg-[#E8F4FD] text-[#2B7EC1]",
  OTHER:               "bg-surface-2 text-text-secondary",
};

interface CategoryIconProps {
  category: AssetCategory;
  size?: number;
  className?: string;
}

export function CategoryIcon({ category, size = 16, className }: CategoryIconProps) {
  const Icon = iconMap[category];
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0",
        colorMap[category],
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
