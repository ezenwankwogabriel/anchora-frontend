"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { BeneficiaryForm } from "@/components/beneficiary/beneficiary-form";
import { BeneficiaryService } from "@/services/beneficiary.service";
import { useToastStore } from "@/stores/toastStore";
import type { BeneficiaryInput } from "@/lib/types";

export function AddBeneficiaryClient() {
  const router   = useRouter();
  const addToast = useToastStore((s) => s.add);

  const handleSubmit = async (data: BeneficiaryInput) => {
    await BeneficiaryService.create(data);
    addToast("Beneficiary added.", "success");
    router.push("/beneficiaries");
  };

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
          <h1 className="font-heading text-[26px] text-text-primary">Add beneficiary</h1>
          <p className="text-[13.5px] text-text-secondary mt-1">
            They&apos;ll receive an email invitation to create their Anchora account.
          </p>
        </div>

        <BeneficiaryForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/beneficiaries")}
        />
      </div>
    </AppLayout>
  );
}
