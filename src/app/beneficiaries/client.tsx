"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { BeneficiaryCard } from "@/components/ui/beneficiary-card";
import { AddBeneficiaryDialog } from "@/components/ui/add-beneficiary-dialog";
import { GuardianDialog } from "@/components/ui/guardian-dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { BeneficiaryService } from "@/services/beneficiary.service";
import { GuardianService } from "@/services/guardian.service";
import { useToastStore } from "@/stores/toastStore";
import type { Beneficiary, Guardian } from "@/lib/types";

export function BeneficiariesClient() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[] | null>(null);
  const [guardian, setGuardian]           = useState<Guardian | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(false);
  const [guardianDialogOpen, setGuardianDialogOpen]     = useState(false);
  const [beneficiaryDialogOpen, setBeneficiaryDialogOpen] = useState(false);
  const [editTarget, setEditTarget]                     = useState<Beneficiary | null>(null);
  const addToast = useToastStore((s) => s.add);

  useEffect(() => {
    Promise.all([BeneficiaryService.getAll(), GuardianService.get()])
      .then(([b, g]) => { setBeneficiaries(b ?? []); setGuardian(g ?? null); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleGuardianSaved = (saved: Guardian) => {
    setGuardian(saved);
    addToast("Guardian saved.", "success");
  };

  const handleGuardianRemoved = () => {
    setGuardian(null);
    addToast("Guardian removed.", "success");
  };

  const openAdd = () => {
    setEditTarget(null);
    setBeneficiaryDialogOpen(true);
  };

  const openEdit = (b: Beneficiary) => {
    setEditTarget(b);
    setBeneficiaryDialogOpen(true);
  };

  const handleBeneficiarySuccess = (updated: Beneficiary) => {
    setBeneficiaries((prev) =>
      editTarget
        ? (prev ?? []).map((b) => (b.id === updated.id ? updated : b))
        : [...(prev ?? []), updated]
    );
    setBeneficiaryDialogOpen(false);
    addToast(editTarget ? "Beneficiary updated." : "Beneficiary added.", "success");
  };

  const handleBeneficiaryDeleted = () => {
    if (editTarget) {
      setBeneficiaries((prev) => (prev ?? []).filter((b) => b.id !== editTarget.id));
      if (guardian?.beneficiaryId === editTarget.id) {
        setGuardian((g) => g ? { ...g, beneficiaryId: null } : null);
      }
    }
    setBeneficiaryDialogOpen(false);
    addToast("Beneficiary removed.", "success");
  };

  const handleSetAsGuardian = async (beneficiary: Beneficiary) => {
    try {
      const saved = await GuardianService.upsert({
        firstName:     beneficiary.name.split(" ")[0],
        email:         beneficiary.email,
        beneficiaryId: beneficiary.id,
      });
      setGuardian(saved);
      addToast(`${beneficiary.name} set as guardian.`, "success");
    } catch {
      addToast("Failed to set guardian.", "error");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center py-16">
          <Loader2 size={24} className="animate-spin text-text-tertiary" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <p className="text-[13px] text-red text-center py-8">Failed to load contacts.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[700px] mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-[28px] text-text-primary">Trusted Contacts</h1>
          <p className="text-[13.5px] text-text-secondary mt-1">
            Your guardian and beneficiaries — the people connected to your vault.
          </p>
        </div>

        {/* Guardian */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[15px] font-semibold text-text-primary">Guardian</h2>
              <p className="text-[12.5px] text-text-tertiary">
                A trusted person who confirms your vault release.
              </p>
            </div>
            <Button size="sm" variant={guardian ? "ghost" : "primary"} onClick={() => setGuardianDialogOpen(true)}>
              <ShieldCheck size={13} />
              {guardian ? "Edit guardian" : "Set a guardian"}
            </Button>
          </div>

          {guardian ? (
            <div className="bg-surface border border-border-color rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-accent flex items-center justify-center text-[13px] font-semibold text-white flex-shrink-0">
                {guardian.firstName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-[3px]">
                  <p className="text-[14px] font-[600] text-text-primary">{guardian.firstName}</p>
                  {guardian.acceptedAt
                    ? <StatusBadge variant="success" label="Active" />
                    : <StatusBadge variant="warning" label="Pending" />}
                </div>
                <p className="text-[12px] text-text-tertiary">{guardian.email}</p>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-border-color rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-2 border border-border-color flex items-center justify-center flex-shrink-0">
                <UserCheck size={18} className="text-text-tertiary" />
              </div>
              <div>
                <p className="text-[13.5px] font-[500] text-text-secondary">No guardian set</p>
                <p className="text-[12px] text-text-tertiary">
                  A guardian can halt a release if you&apos;re still active.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Beneficiaries */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[15px] font-semibold text-text-primary">Beneficiaries</h2>
              <p className="text-[12.5px] text-text-tertiary">
                People who will receive access to your vault.
              </p>
            </div>
            <Button size="sm" onClick={openAdd}>
              <Plus size={13} />
              Add beneficiary
            </Button>
          </div>

          {(beneficiaries?.length ?? 0) === 0 ? (
            <div className="text-center py-10">
              <p className="text-[14px] text-text-secondary mb-1">No beneficiaries yet.</p>
              <p className="text-[13px] text-text-tertiary mb-5">
                Add someone who should have access to your vault.
              </p>
              <Button onClick={openAdd}>Add your first beneficiary</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {beneficiaries!.map((b) => (
                <BeneficiaryCard
                  key={b.id}
                  beneficiary={b}
                  isGuardian={guardian?.beneficiaryId === b.id}
                  onEdit={openEdit}
                  onSetAsGuardian={handleSetAsGuardian}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <GuardianDialog
        open={guardianDialogOpen}
        onClose={() => setGuardianDialogOpen(false)}
        onSaved={handleGuardianSaved}
        onRemoved={handleGuardianRemoved}
        guardian={guardian}
        beneficiaries={beneficiaries ?? []}
      />

      <AddBeneficiaryDialog
        open={beneficiaryDialogOpen}
        onClose={() => setBeneficiaryDialogOpen(false)}
        onSuccess={handleBeneficiarySuccess}
        onDeleted={handleBeneficiaryDeleted}
        beneficiary={editTarget ?? undefined}
      />
    </AppLayout>
  );
}
