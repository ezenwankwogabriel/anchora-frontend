"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { VaultService } from "@/services/vault.service";
import { useToastStore } from "@/stores/toastStore";
import { koboToNaira, parseNairaInputToKobo } from "@/lib/currency";
import { recordToInput } from "@/lib/types";
import type { VaultRecord } from "@/lib/types";

interface UpdateValuesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  records: VaultRecord[];
  // Called once immediately with the values the user entered (before the
  // network round-trip), and again once every PATCH settles, to reconcile
  // the local state with what the server actually persisted (or to roll a
  // row back to its prior value if its PATCH failed).
  onValuesChange: (updates: Record<string, number | null>) => void;
}

function valueToString(record: VaultRecord): string {
  return record.estimatedValue != null ? String(koboToNaira(record.estimatedValue)) : "";
}

function recordLabel(r: VaultRecord): string {
  return r.accountName ? `${r.institutionName} · ${r.accountName}` : r.institutionName;
}

function ValueRow({
  record,
  value,
  onChange,
}: {
  record: VaultRecord;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <CategoryIcon category={record.category} size={14} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-[500] text-text-primary truncate">{recordLabel(record)}</p>
      </div>
      <CurrencyInput
        size="sm"
        wrapperClassName="w-[140px] flex-shrink-0"
        placeholder="0.00"
        value={value}
        onChange={onChange}
        aria-label={recordLabel(record)}
      />
    </div>
  );
}

export function UpdateValuesSheet({ open, onOpenChange, records, onValuesChange }: UpdateValuesSheetProps) {
  const addToast = useToastStore((s) => s.add);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(records.map((r) => [r.id, valueToString(r)])),
  );

  // Resync to the latest records whenever the sheet opens — it stays
  // mounted across open/close cycles (see dashboard/page.tsx), so without
  // this it keeps showing whatever was true the first time it ever mounted,
  // even after records changed elsewhere. Deliberately keyed only on
  // `open`, not `records` — resyncing on every records change would also
  // wipe out an in-progress edit if something else updates records while
  // the sheet is already open.
  useEffect(() => {
    if (open) {
      setValues(Object.fromEntries(records.map((r) => [r.id, valueToString(r)])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const valuedRecords = records.filter((r) => r.estimatedValue != null);
  const unvaluedRecords = records.filter((r) => r.estimatedValue == null);

  // Per-record save version. The sheet stays mounted across open/close
  // cycles, so a save batch can still be in flight when the user reopens it
  // and saves the same record again — without this, whichever batch's PATCH
  // resolves last wins, even if it's the older, now-stale one.
  const versionRef = useRef<Record<string, number>>({});

  const handleSave = () => {
    const changed = records.filter((r) => (values[r.id] ?? "") !== valueToString(r));
    onOpenChange(false);
    if (changed.length === 0) return;

    const previous = new Map(changed.map((r) => [r.id, r.estimatedValue]));
    const entered = new Map(changed.map((r) => [r.id, parseNairaInputToKobo(values[r.id] ?? "")]));
    const myVersions = new Map(
      changed.map((r) => [r.id, (versionRef.current[r.id] = (versionRef.current[r.id] ?? 0) + 1)]),
    );

    // Optimistic: reflect what the user typed immediately, before the
    // network round-trip resolves.
    onValuesChange(Object.fromEntries(entered));

    Promise.allSettled(
      changed.map((r) =>
        VaultService.updateRecord(r.id, {
          ...recordToInput(r),
          estimatedValue: entered.get(r.id) ?? null,
        }),
      ),
    ).then((results) => {
      const reconciled: Record<string, number | null> = {};
      let failedCount = 0;
      results.forEach((res, i) => {
        const id = changed[i].id;
        // A newer save batch for this record has since started — let that
        // batch's reconciliation win instead of overwriting it with ours.
        if (versionRef.current[id] !== myVersions.get(id)) return;
        if (res.status === "fulfilled") {
          reconciled[id] = res.value.estimatedValue ?? null;
        } else {
          failedCount += 1;
          reconciled[id] = previous.get(id) ?? null;
        }
      });
      if (Object.keys(reconciled).length > 0) onValuesChange(reconciled);

      if (failedCount > 0) {
        addToast(
          `Saved, but ${failedCount} record${failedCount === 1 ? "" : "s"} failed to update.`,
          "error",
        );
      } else {
        addToast("Your values have been updated.", "success");
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[420px] sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle>Update values</SheetTitle>
          <SheetDescription>
            Review and adjust the estimated value of your recorded assets.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-5 space-y-5">
          {valuedRecords.length > 0 && (
            <div className="space-y-3">
              {valuedRecords.map((r) => (
                <ValueRow
                  key={r.id}
                  record={r}
                  value={values[r.id] ?? ""}
                  onChange={(v) => setValues((prev) => ({ ...prev, [r.id]: v }))}
                />
              ))}
            </div>
          )}

          {valuedRecords.length > 0 && unvaluedRecords.length > 0 && (
            <div className="border-t border-border-color" />
          )}

          {unvaluedRecords.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">
                Not yet valued
              </p>
              {unvaluedRecords.map((r) => (
                <ValueRow
                  key={r.id}
                  record={r}
                  value={values[r.id] ?? ""}
                  onChange={(v) => setValues((prev) => ({ ...prev, [r.id]: v }))}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-6 flex-shrink-0">
          <Button type="button" fullWidth onClick={handleSave}>
            Save
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
