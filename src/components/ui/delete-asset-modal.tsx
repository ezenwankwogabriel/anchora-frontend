"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { VaultService } from "@/services/vault.service";
import { ServiceError } from "@/lib/types";
import { useToastStore } from "@/stores/toastStore";

interface DeleteAssetModalProps {
  open: boolean;
  recordId: string;
  recordName: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function DeleteAssetModal({
  open,
  recordId,
  recordName,
  onSuccess,
  onClose,
}: DeleteAssetModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const addToast = useToastStore((s) => s.add);

  if (!open) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await VaultService.deleteRecord(recordId);
      addToast("Record deleted.", "success");
      onSuccess();
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-surface rounded-2xl border border-border-color shadow-md w-full max-w-[420px] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-[10px] bg-red-light flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={17} className="text-red" />
          </div>
          <h2 className="font-heading text-[20px] text-text-primary leading-snug">
            Delete {recordName}?
          </h2>
        </div>

        <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
          This record will be permanently deleted and cannot be recovered. If a
          release has already been sent to your beneficiaries, it will not remove
          the record from their report.
        </p>

        {error && (
          <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            variant="danger"
            fullWidth
            disabled={loading}
            onClick={handleDelete}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Delete permanently
          </Button>
          <Button
            variant="ghost"
            fullWidth
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
