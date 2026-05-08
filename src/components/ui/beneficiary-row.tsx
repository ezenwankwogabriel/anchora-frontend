import type { Beneficiary } from "@/lib/types";
import { StatusBadge } from "./status-badge";

interface BeneficiaryRowProps {
  beneficiary: Beneficiary;
}

export function BeneficiaryRow({ beneficiary }: BeneficiaryRowProps) {
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
    <div className="flex items-center gap-3 py-3 border-b border-border-color last:border-0">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-accent flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-[550] text-text-primary truncate">
          {beneficiary.name}
        </p>
        <p className="text-[11.5px] text-text-tertiary truncate">
          {beneficiary.relationship.charAt(0) + beneficiary.relationship.slice(1).toLowerCase()}
        </p>
      </div>
      <StatusBadge variant={statusVariant} label={statusLabel} />
    </div>
  );
}
