"use client";

import { useState } from "react";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import type { VaultRecord, AssetCategory } from "@/lib/types";
import { CategoryIcon, categoryLabels } from "./category-icon";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface AssetCategoryRowProps {
  category: AssetCategory;
  records: VaultRecord[];
  onDelete: (id: string) => void;
}

interface RecordRowProps {
  record: VaultRecord;
  onDelete: (id: string) => void;
}

function RecordRow({ record, onDelete }: RecordRowProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center py-[10px] pl-10 pr-2 border-b border-border-color last:border-0">
      <Link
        href={`/vault/${record.id}/edit`}
        className="flex-1 min-w-0 pr-3 no-underline"
      >
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-[500] text-text-primary">
            {record.institutionName}
          </p>
          {record.category === "CRYPTO_WALLET" && record.isSelfCustodied && (
            <span className="bg-amber-100 text-amber-800 text-[10.5px] font-medium px-2 py-0.5 rounded-full flex-shrink-0">
              Self-custodied
            </span>
          )}
        </div>
        <p className="text-[11.5px] text-text-tertiary">
          {record.accountName ?? ""}
        </p>
        {record.intendedBeneficiary && (
          <p className="text-[11.5px] text-text-secondary mt-[2px]">
            For: {record.intendedBeneficiary}
          </p>
        )}
      </Link>

      {confirming ? (
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[12px] text-text-secondary">Delete?</span>
          <Button variant="danger" size="sm" onClick={() => onDelete(record.id)}>
            Yes
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>
            No
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex-shrink-0 p-1.5 rounded-md text-text-tertiary hover:text-red hover:bg-red-light transition-colors"
          aria-label="Delete record"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export function AssetCategoryRow({ category, records, onDelete }: AssetCategoryRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border-color last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 py-3.5 px-2 hover:bg-surface-2 rounded-md transition-colors"
      >
        <CategoryIcon category={category} size={15} />
        <span className="flex-1 text-left text-[13.5px] font-[500] text-text-primary">
          {categoryLabels[category]}
        </span>
        <span className="text-[12px] text-text-tertiary mr-2">
          {records.length} {records.length === 1 ? "record" : "records"}
        </span>
        <span className={cn("text-text-tertiary transition-transform", open && "rotate-0")}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {open && records.length > 0 && (
        <div>
          {records.map((r) => (
            <RecordRow key={r.id} record={r} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
