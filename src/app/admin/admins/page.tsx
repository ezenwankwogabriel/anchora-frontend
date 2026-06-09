"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, UserX } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection } from "@/components/ui/form-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminService } from "@/services/admin.service";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ServiceError } from "@/lib/types";
import type { AdminAccount, AdminRole } from "@/lib/admin-types";

const zodResolver = _zodResolver as unknown as <T extends object>(
  schema: z.ZodType<T>
) => Resolver<T>;

const createSchema = z.object({
  email: z.string().min(1, "Required").email("Enter a valid email"),
  role:  z.enum(["ADMIN", "READ_ONLY"]),
});
type CreateFormData = z.infer<typeof createSchema>;

function roleLabel(role: AdminRole) {
  switch (role) {
    case "SUPER_ADMIN": return "Super Admin";
    case "ADMIN":       return "Admin";
    case "READ_ONLY":   return "Read Only";
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Create admin modal ────────────────────────────────────────────────────────

function CreateAdminModal({
  onSuccess,
  onClose,
}: {
  onSuccess: (admin: AdminAccount) => void;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({ resolver: zodResolver(createSchema) });

  const onSubmit = async (values: CreateFormData) => {
    try {
      const newAdmin = await AdminService.createAdmin(values);
      onSuccess(newAdmin);
    } catch (err) {
      setError("root", {
        message: err instanceof ServiceError ? err.message : "Failed to create admin.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 bg-surface rounded-2xl border border-border-color shadow-md w-full max-w-[420px] p-6">
        <h2 className="font-heading text-[19px] text-text-primary mb-5">Create admin account</h2>

        <form onSubmit={handleSubmit(onSubmit)} method="post" noValidate>
          <FormSection>
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
              Email *
            </label>
            <Input type="email" placeholder="admin@anchora.co.uk" {...register("email")} />
            {errors.email && (
              <p className="text-[11.5px] text-red mt-[5px]">{errors.email.message}</p>
            )}
          </FormSection>

          <FormSection>
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
              Role *
            </label>
            <select
              {...register("role")}
              className="w-full px-3 py-2 text-[13px] bg-surface border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="ADMIN">Admin</option>
              <option value="READ_ONLY">Read Only</option>
            </select>
            {errors.role && (
              <p className="text-[11.5px] text-red mt-[5px]">{errors.role.message}</p>
            )}
          </FormSection>

          {errors.root?.message && (
            <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
              {errors.root.message}
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button fullWidth type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Create account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Deactivate confirm modal ───────────────────────────────────────────────────

function DeactivateModal({
  admin,
  onConfirm,
  onClose,
  loading,
}: {
  admin: AdminAccount;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 bg-surface rounded-2xl border border-border-color shadow-md w-full max-w-[400px] p-6">
        <h2 className="font-heading text-[19px] text-text-primary mb-2">Deactivate account</h2>
        <p className="text-[13px] text-text-secondary mb-6">
          Deactivating <strong className="text-text-primary">{admin.email}</strong> will
          revoke their access to the admin dashboard immediately.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            Deactivate
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminAccountsPage() {
  const router                  = useRouter();
  const { isAuthenticated, admin } = useAdminAuth();

  const [admins, setAdmins]           = useState<AdminAccount[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [deactivating, setDeactivating] = useState<AdminAccount | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Only SUPER_ADMIN may access this page
  useEffect(() => {
    if (isAuthenticated && admin && admin.role !== "SUPER_ADMIN") {
      router.replace("/admin/users");
    }
  }, [isAuthenticated, admin, router]);

  const fetchAdmins = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    AdminService.getAdmins()
      .then(setAdmins)
      .catch((err) =>
        setError(err instanceof ServiceError ? err.message : "Failed to load admins.")
      )
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleDeactivate = async () => {
    if (!deactivating) return;
    setDeactivateLoading(true);
    try {
      await AdminService.deactivateAdmin(deactivating.id);
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === deactivating.id ? { ...a, isActive: false } : a
        )
      );
      setDeactivating(null);
    } catch {
      /* silent */
    } finally {
      setDeactivateLoading(false);
    }
  };

  if (!isAuthenticated || admin?.role !== "SUPER_ADMIN") return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-[22px] text-text-primary">Admin Accounts</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">
            {admins.filter((a) => a.isActive).length} active admins
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={14} />
          Create admin
        </Button>
      </div>

      {error && (
        <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-5">
          {error}
        </p>
      )}

      <div className="bg-surface border border-border-color rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={20} className="animate-spin text-text-tertiary" />
          </div>
        ) : admins.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[13px] text-text-tertiary">No admin accounts found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-color">
                {["Email", "Role", "Status", "Last login", "Created", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11.5px] font-semibold text-text-tertiary tracking-[0.04em] uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border-color last:border-0 hover:bg-surface-2 transition-colors"
                >
                  <td className="px-5 py-3.5 text-[13.5px] text-text-primary">{a.email}</td>
                  <td className="px-5 py-3.5 text-[13px] text-text-secondary">
                    {roleLabel(a.role)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge
                      variant={a.isActive ? "success" : "error"}
                      label={a.isActive ? "Active" : "Inactive"}
                    />
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-text-secondary whitespace-nowrap">
                    {formatDate(a.lastLoginAt)}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-text-secondary whitespace-nowrap">
                    {formatDate(a.createdAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {a.isActive && a.id !== admin?.id && (
                      <button
                        onClick={() => setDeactivating(a)}
                        className="inline-flex items-center gap-1.5 text-[12.5px] text-red hover:underline"
                      >
                        <UserX size={13} />
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateAdminModal
          onSuccess={(newAdmin) => {
            setAdmins((prev) => [newAdmin, ...prev]);
            setShowCreate(false);
          }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {deactivating && (
        <DeactivateModal
          admin={deactivating}
          onConfirm={handleDeactivate}
          onClose={() => setDeactivating(null)}
          loading={deactivateLoading}
        />
      )}
    </div>
  );
}
