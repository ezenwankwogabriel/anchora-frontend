import { formatNaira } from "@/lib/currency";
import type { VaultRecord } from "@/lib/types";

interface DocumentedValueCardProps {
  records: VaultRecord[];
  onUpdateClick: () => void;
}

export function DocumentedValueCard({ records, onUpdateClick }: DocumentedValueCardProps) {
  const valuedRecords = records.filter((r) => r.estimatedValue != null);
  if (valuedRecords.length === 0) return null;

  const totalKobo = valuedRecords.reduce((sum, r) => sum + (r.estimatedValue ?? 0), 0);

  return (
    <div className="bg-surface border border-border-color rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.07em] text-text-tertiary mb-1">
            Documented value
          </p>
          <p className="text-[34px] font-serif-display leading-none text-text-primary">
            {formatNaira(totalKobo)}
          </p>
          <p className="text-[12px] text-text-tertiary mt-2">
            Based on the values you&apos;ve entered
          </p>
        </div>
        <button
          type="button"
          onClick={onUpdateClick}
          className="text-[12.5px] font-medium text-accent hover:text-accent-hover whitespace-nowrap flex-shrink-0 mt-1"
        >
          Update values
        </button>
      </div>
    </div>
  );
}
