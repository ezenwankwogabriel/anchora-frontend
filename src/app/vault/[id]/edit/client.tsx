"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { VaultForm } from "@/components/vault/vault-form";
import { DeleteAssetModal } from "@/components/ui/delete-asset-modal";
import { Button } from "@/components/ui/button";
import { VaultService } from "@/services/vault.service";
import { useToastStore } from "@/stores/toastStore";
import { categoryLabels } from "@/components/ui/category-icon";
import type { VaultRecord, VaultRecordInput } from "@/lib/types";

interface EditAssetClientProps {
  id: string;
}

export function EditAssetClient({ id }: EditAssetClientProps) {
  const router   = useRouter();
  const addToast = useToastStore((s) => s.add);

  const [record, setRecord]           = useState<VaultRecord | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen]   = useState(false);

  useEffect(() => {
    VaultService.getRecord(id)
      .then((data) => setRecord(data ?? null))
      .catch(() => setError("Could not load this asset."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: VaultRecordInput) => {
    await VaultService.updateRecord(id, data);
    addToast("Asset updated.", "success");
    router.push("/dashboard");
  };

  const handleDeleteSuccess = () => {
    setDeleteOpen(false);
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 size={28} className="animate-spin text-text-tertiary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !record) {
    return (
      <AppLayout>
        <div className="max-w-[600px] mx-auto pt-8 text-center">
          <p className="text-[13.5px] text-text-secondary mb-4">
            {error ?? "Asset not found."}
          </p>
          <Link href="/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const updatedAt = new Date(record.updatedAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <AppLayout>
      <div className="max-w-[600px] mx-auto">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors mb-3"
            >
              <ArrowLeft size={15} />
              Back to dashboard
            </Link>
            <h1 className="font-heading text-[26px] text-text-primary leading-tight">
              {record.accountName}{record.accountType ? ` — ${record.accountType}` : ""}
            </h1>
            <p className="text-[12.5px] text-text-tertiary mt-1">
              {categoryLabels[record.category]} · Last edited {updatedAt}
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="mt-8 flex-shrink-0"
          >
            <Trash2 size={13} />
            Delete asset
          </Button>
        </div>

        <VaultForm
          category={record.category}
          record={record}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/dashboard")}
        />

        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="text-[12.5px] text-text-tertiary hover:text-red transition-colors bg-transparent border-none cursor-pointer font-sans"
          >
            Delete this asset
          </button>
        </div>
      </div>

      <DeleteAssetModal
        open={deleteOpen}
        recordId={record.id}
        recordName={record.accountType ? `${record.accountName} — ${record.accountType}` : record.accountName}
        onSuccess={handleDeleteSuccess}
        onClose={() => setDeleteOpen(false)}
      />
    </AppLayout>
  );
}
