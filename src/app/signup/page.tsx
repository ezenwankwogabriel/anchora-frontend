"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/ui/password-strength";
import { SocialAuthButtons } from "@/components/ui/social-auth-buttons";
import { AuthService } from "@/services/auth.service";
import { ServiceError } from "@/lib/types";
import { captureAcquisition } from "@/lib/acquisition";
import { initPostHog, posthog } from "@/lib/posthog";

const schema = z
  .object({
    firstName: z.string().min(1, "Required"),
    lastName: z.string().min(1, "Required"),
    email: z.email({ message: "Enter a valid email" }),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .refine((v) => /[A-Z]/.test(v), "Must include uppercase")
      .refine((v) => /[0-9]/.test(v), "Must include number")
      .refine((v) => /[^a-zA-Z0-9]/.test(v), "Must include special character"),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((v) => v, "You must accept the Terms of Service"),
    privacyAccepted: z.boolean().refine((v) => v, "You must accept the Privacy Policy"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11.5px] text-red mt-[5px]">{message}</p>;
}

function SignupForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { termsAccepted: false, privacyAccepted: false },
  });

  const passwordValue = watch("password") ?? "";

  useEffect(() => {
    initPostHog();
    captureAcquisition();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const acquisition = captureAcquisition();
      const result = await AuthService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        acquisitionSource: acquisition?.acquisitionSource,
        acquisitionMedium: acquisition?.acquisitionMedium,
        acquisitionCampaign: acquisition?.acquisitionCampaign,
        acquisitionContent: acquisition?.acquisitionContent,
        landingPage: acquisition?.landingPage,
        firstTouchAt: acquisition?.firstTouchAt,
      });

      posthog.identify(result.userId, { email: data.email });
      posthog.capture("signup_complete", {
        acquisition_source: acquisition?.acquisitionSource,
        acquisition_medium: acquisition?.acquisitionMedium,
        acquisition_campaign: acquisition?.acquisitionCampaign,
        acquisition_content: acquisition?.acquisitionContent,
      });

      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError("root", {
        message: err instanceof ServiceError ? err.message : "Something went wrong",
      });
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-heading text-[24px] sm:text-[26px] text-text-primary mb-1">
        Create your account
      </h1>
      <p className="text-[13.5px] text-text-secondary mb-4 sm:mb-7">
        Already have one?{" "}
        <Link href="/login" className="text-accent font-medium hover:underline">
          Sign in instead
        </Link>
      </p>

      <SocialAuthButtons />

      <form onSubmit={handleSubmit(onSubmit)} method="post" noValidate>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
              First name
            </label>
            <Input placeholder="Olumide" {...register("firstName")} />
            <FieldError message={errors.firstName?.message} />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
              Last name
            </label>
            <Input placeholder="Adeyemi" {...register("lastName")} />
            <FieldError message={errors.lastName?.message} />
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
            Email address
          </label>
          <Input type="email" placeholder="olumide@gmail.com" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="mb-3">
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
            Password
          </label>
          <PasswordInput placeholder="At least 8 characters" {...register("password")} />
          <PasswordStrength value={passwordValue} />
          <FieldError message={errors.password?.message} />
        </div>

        <div className="mb-3">
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
            Confirm password
          </label>
          <PasswordInput placeholder="Repeat your password" {...register("confirmPassword")} />
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <label className="flex items-start gap-2 text-[12.5px] text-text-secondary cursor-pointer">
            <input type="checkbox" className="mt-[2px] flex-shrink-0 accent-accent" {...register("termsAccepted")} />
            <span>
              I accept the{" "}
              <Link
                href="https://www.anchora.com.ng/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Terms of Service
              </Link>
            </span>
          </label>
          <FieldError message={errors.termsAccepted?.message} />
          <label className="flex items-start gap-2 text-[12.5px] text-text-secondary cursor-pointer">
            <input type="checkbox" className="mt-[2px] flex-shrink-0 accent-accent" {...register("privacyAccepted")} />
            <span>
              I accept the{" "}
              <Link
                href="https://www.anchora.com.ng/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          <FieldError message={errors.privacyAccepted?.message} />
        </div>

        {errors.root && (
          <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-3">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          Create account →
        </Button>

        <p className="hidden sm:block mt-5 text-center text-[12px] text-text-tertiary">
          After creating your account, we&apos;ll send you a verification email.
        </p>
      </form>
    </AuthLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
