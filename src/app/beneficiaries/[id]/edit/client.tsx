"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { BeneficiaryForm } from "@/components/beneficiary/beneficiary-form";
import { Button } from "@/components/ui/button";
import { BeneficiaryService } from "@/services/beneficiary.service";
import { useToastStore } from "@/stores/toastStore";
import { RELATIONSHIP_LABELS } from "@/lib/schemas/beneficiary";
import type { BeneficiaryDetail, BeneficiaryInput } from "@/lib/types";

interface EditBeneficiaryClientProps {
  id: string;
}

export function EditBeneficiaryClient({ id }: EditBeneficiaryClientProps) {
  const router   = useRouter();
  const addToast = useToastStore((s) => s.add);

  const [beneficiary, setBeneficiary]     = useState<BeneficiaryDetail | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  useEffect(() => {
    BeneficiaryService.get(id)
      .then((data) => setBeneficiary(data ?? null))
      .catch(() => setError("Could not load this beneficiary."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: BeneficiaryInput) => {
    await BeneficiaryService.update(id, data);
    addToast("Beneficiary updated.", "success");
    router.push("/beneficiaries");
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await BeneficiaryService.remove(id);
      addToast("Beneficiary removed.", "success");
      router.push("/beneficiaries");
    } catch {
      addToast("Failed to remove beneficiary.", "error");
      setDeleting(false);
      setConfirmDelete(false);
    }
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

  if (error || !beneficiary) {
    return (
      <AppLayout>
        <div className="max-w-[540px] mx-auto pt-8 text-center">
          <p className="text-[13.5px] text-text-secondary mb-4">
            {error ?? "Beneficiary not found."}
          </p>
          <Link href="/beneficiaries">
            <Button variant="secondary">Back to beneficiaries</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[540px] mx-auto">
        <div className="mb-6">
          <Link
            href="/beneficiaries"
            className="inline-flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors mb-3"
          >
            <ArrowLeft size={15} />
            Back to beneficiaries
          </Link>
          <h1 className="font-heading text-[26px] text-text-primary leading-tight">
            {beneficiary.name}
          </h1>
          <p className="text-[12.5px] text-text-tertiary mt-1">
            {RELATIONSHIP_LABELS[beneficiary.relationship]}
          </p>
        </div>

        <BeneficiaryForm
          beneficiary={beneficiary}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/beneficiaries")}
        />

        <div className="mt-4 pt-4 border-t border-border-color">
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <p className="text-[12.5px] text-text-secondary flex-1">
                Remove {beneficiary.name}? They will lose access to your vault records.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                Yes, remove
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-[12.5px] text-text-tertiary hover:text-red transition-colors bg-transparent border-none cursor-pointer font-sans"
            >
              Remove this beneficiary
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
