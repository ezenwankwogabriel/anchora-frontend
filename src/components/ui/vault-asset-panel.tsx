"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { VaultForm } from "@/components/vault/vault-form";
import { CategoryIcon, categoryLabels } from "@/components/ui/category-icon";
import { Button } from "@/components/ui/button";
import { VaultService } from "@/services/vault.service";
import { useToastStore } from "@/stores/toastStore";
import type { VaultRecord, VaultRecordInput } from "@/lib/types";

interface VaultAssetPanelProps {
  open: boolean;
  onClose: () => void;
  onSaved: (record: VaultRecord) => void;
  onDeleted: (id: string) => void;
  record: VaultRecord | null;
}

export function VaultAssetPanel({ open, onClose, onSaved, onDeleted, record }: VaultAssetPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const addToast = useToastStore((s) => s.add);

  const handleUpdate = async (data: VaultRecordInput) => {
    const updated = await VaultService.updateRecord(record!.id, data);
    addToast("Asset updated.", "success");
    onSaved(updated);
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await VaultService.deleteRecord(record!.id);
      addToast("Asset deleted.", "success");
      onDeleted(record!.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirming(false);
    onClose();
  };

  const updatedAt = record
    ? new Date(record.updatedAt).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open && record ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[520px] bg-surface border-l border-border-color shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          open && record ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {record && (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-border-color flex items-start justify-between flex-shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 flex-shrink-0">
                  <CategoryIcon category={record.category} size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-text-primary truncate">
                    {record.accountName}
                    {record.accountType ? ` — ${record.accountType}` : ""}
                  </p>
                  <p className="text-[12px] text-text-tertiary mt-[2px]">
                    {categoryLabels[record.category]} · Last edited {updatedAt}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="ml-4 flex-shrink-0 text-text-tertiary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <VaultForm
                category={record.category}
                record={record}
                onSubmit={handleUpdate}
                onCancel={handleClose}
              />

              {/* Delete */}
              <div className="mt-6 pt-5 border-t border-border-color">
                {confirming ? (
                  <div className="flex items-center gap-3">
                    <p className="text-[12.5px] text-text-secondary flex-1">
                      Delete this asset? This cannot be undone.
                    </p>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting && <Loader2 size={12} className="animate-spin" />}
                      Yes, delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirming(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="text-[12.5px] text-text-tertiary hover:text-red transition-colors bg-transparent border-none cursor-pointer font-sans"
                  >
                    Delete this asset
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
