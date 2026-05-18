import Link from "next/link";
import type { Beneficiary } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { RELATIONSHIP_LABELS } from "@/lib/schemas/beneficiary";

interface BeneficiaryCardProps {
  beneficiary: Beneficiary;
}

export function BeneficiaryCard({ beneficiary }: BeneficiaryCardProps) {
  const initials = beneficiary.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const statusVariant =
    beneficiary.status === "ACTIVE" || beneficiary.status === "ACCOUNT_CREATED"
      ? "success"
      : beneficiary.status === "INVITED"
      ? "warning"
      : "error";

  const statusLabel =
    beneficiary.status === "ACTIVE" || beneficiary.status === "ACCOUNT_CREATED"
      ? "Active"
      : beneficiary.status === "INVITED"
      ? "Invited"
      : "Deleted";

  return (
    <div className="bg-surface border border-border-color rounded-xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-accent flex items-center justify-center text-[13px] font-semibold text-white flex-shrink-0">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-[3px]">
          <p className="text-[14px] font-[600] text-text-primary">{beneficiary.name}</p>
          {beneficiary.isDefault && (
            <span className="text-[10.5px] font-semibold text-accent bg-accent-light px-[7px] py-[2px] rounded-full">
              Default
            </span>
          )}
        </div>
        <p className="text-[12px] text-text-tertiary mb-2">
          {RELATIONSHIP_LABELS[beneficiary.relationship]}
          {beneficiary.vaultRecordCount > 0 &&
            ` · ${beneficiary.vaultRecordCount} ${beneficiary.vaultRecordCount === 1 ? "asset" : "assets"}`}
        </p>
        <StatusBadge variant={statusVariant} label={statusLabel} />
      </div>

      <Link
        href={`/beneficiaries/${beneficiary.id}/edit`}
        className="text-[12.5px] text-text-secondary hover:text-text-primary transition-colors flex-shrink-0 mt-0.5"
      >
        Edit
      </Link>
    </div>
  );
}
