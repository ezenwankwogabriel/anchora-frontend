"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/ui/password-strength";
import { AdminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toastStore";
import { ServiceError } from "@/lib/types";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .refine((v) => /[A-Z]/.test(v), "Must include uppercase")
      .refine((v) => /[0-9]/.test(v), "Must include number")
      .refine((v) => /[^a-zA-Z0-9]/.test(v), "Must include special character"),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  token?: string;
}

export function SetAdminPasswordClient({ token }: Props) {
  const router = useRouter();
  const addToast = useToastStore((s) => s.add);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const newPasswordValue = watch("newPassword") ?? "";

  if (!token) {
    return (
      <AuthCard>
        <div className="text-center">
          <h1 className="font-heading text-[22px] text-text-primary mb-3">
            Link invalid
          </h1>
          <p className="text-[13.5px] text-text-secondary mb-5">
            This invite link is missing a token.
          </p>
          <Link href="/admin/login" className="text-accent hover:underline text-[13px] font-medium">
            Go to admin login →
          </Link>
        </div>
      </AuthCard>
    );
  }

  const onSubmit = async (data: FormData) => {
    try {
      await AdminService.setAdminPassword({ token, newPassword: data.newPassword });
      addToast("Password set. Sign in with your new password.", "success");
      router.push("/admin/login");
    } catch (err) {
      if (err instanceof ServiceError && err.status === 410) {
        setError("root", {
          message: "expired",
        });
      } else {
        const msg = err instanceof ServiceError ? err.message : "Something went wrong";
        setError("root", { message: msg });
      }
    }
  };

  return (
    <AuthCard>
      <h1 className="font-heading text-[24px] text-text-primary mb-2">
        Set up your admin account
      </h1>
      <p className="text-[13.5px] text-text-secondary mb-6">
        Choose a password to finish setting up your Anchora admin account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} method="post" noValidate>
        <div className="mb-4">
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
            New password
          </label>
          <PasswordInput
            placeholder="At least 8 characters"
            {...register("newPassword")}
          />
          <PasswordStrength value={newPasswordValue} />
          {errors.newPassword && (
            <p className="text-[11.5px] text-red mt-[5px]">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="mb-5">
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
            Confirm new password
          </label>
          <PasswordInput
            placeholder="Repeat your password"
            {...register("confirmNewPassword")}
          />
          {errors.confirmNewPassword && (
            <p className="text-[11.5px] text-red mt-[5px]">
              {errors.confirmNewPassword.message}
            </p>
          )}
        </div>

        {errors.root?.message === "expired" ? (
          <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
            This link has expired. Ask a super admin to re-invite you.
          </p>
        ) : errors.root ? (
          <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
            {errors.root.message}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          Set password →
        </Button>
      </form>
    </AuthCard>
  );
}
