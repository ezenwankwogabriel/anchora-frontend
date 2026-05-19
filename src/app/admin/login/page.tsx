"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { AdminService } from "@/services/admin.service";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { ServiceError } from "@/lib/types";

const zodResolver = _zodResolver as unknown as <T extends object>(
  schema: z.ZodType<T>
) => Resolver<T>;

const schema = z.object({
  email:    z.string().min(1, "Required").email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router          = useRouter();
  const setAuth         = useAdminAuthStore((s) => s.setAuth);
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) router.replace("/admin/users");
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    try {
      const { admin, accessToken } = await AdminService.login(values);
      setAuth(admin, accessToken);
      router.replace("/admin/users");
    } catch (err) {
      setError("root", {
        message: err instanceof ServiceError ? err.message : "Invalid credentials",
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <span className="font-heading text-[22px] text-text-primary tracking-tight">
            Anchora <span className="text-accent font-normal">Admin</span>
          </span>
        </div>

        <div className="bg-surface rounded-2xl border border-border-color p-8">
          <h1 className="font-heading text-[22px] text-text-primary mb-1">Sign in</h1>
          <p className="text-[13px] text-text-secondary mb-6">
            Access the internal dashboard.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
                Password *
              </label>
              <Input type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && (
                <p className="text-[11.5px] text-red mt-[5px]">{errors.password.message}</p>
              )}
            </FormSection>

            {errors.root?.message && (
              <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Sign in →
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
