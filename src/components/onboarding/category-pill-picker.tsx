"use client";

import type { AssetCategory } from "@/lib/types";
import { SELECTABLE_CATEGORIES } from "@/lib/schemas/vault";
import { CategoryIcon, categoryLabels } from "@/components/ui/category-icon";
import { cn } from "@/lib/utils";

// Fixed, deterministic rotation cycle — never randomized per render (avoids
// layout jitter on re-render/selection). Small enough to read as "scattered"
// without hurting tap targets.
const ROTATIONS = [
  "-rotate-2",
  "rotate-1",
  "rotate-2",
  "-rotate-1",
  "rotate-2",
  "-rotate-2",
  "rotate-1",
];

interface CategoryPillPickerProps {
  selected: AssetCategory[];
  onToggle: (category: AssetCategory) => void;
}

export function CategoryPillPicker({ selected, onToggle }: CategoryPillPickerProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {SELECTABLE_CATEGORIES.map((cat, i) => {
        const isSelected = selected.includes(cat);
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onToggle(cat)}
            className={cn(
              "flex items-center gap-2 pl-3 pr-4 py-2 rounded-full border-[1.5px] transition-all duration-200",
              ROTATIONS[i % ROTATIONS.length],
              isSelected
                ? "border-accent bg-[#EFF6FF] text-accent !rotate-0 scale-[1.03]"
                : "border-border-color text-text-primary hover:border-accent hover:bg-surface-2"
            )}
          >
            <CategoryIcon category={cat} size={14} className="w-6 h-6" />
            <span className="text-[13px] font-semibold">{categoryLabels[cat]}</span>
          </button>
        );
      })}
    </div>
  );
}
