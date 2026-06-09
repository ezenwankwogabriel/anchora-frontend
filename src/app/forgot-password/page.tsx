"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthService } from "@/services/auth.service";

const schema = z.object({
  email: z.email({ message: "Enter a valid email" }),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await AuthService.forgotPassword(data.email);
      setSubmitted(true);
    } catch {
      // Always show success to avoid email enumeration
      setSubmitted(true);
    }
  };

  return (
    <AuthCard>
      <Link
        href="/login"
        className="inline-flex items-center gap-[6px] text-[12.5px] text-text-secondary hover:text-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={13} />
        Back to sign in
      </Link>

      {submitted ? (
        <div className="text-center">
          <div className="w-12 h-12 bg-green-light rounded-xl flex items-center justify-center mx-auto mb-4">
            <MailCheck size={22} className="text-green" />
          </div>
          <h1 className="font-heading text-[22px] text-text-primary mb-3">
            Check your inbox
          </h1>
          <p className="text-[13.5px] text-text-secondary leading-relaxed mb-5">
            If an account exists for{" "}
            <strong className="text-text-primary">{getValues("email")}</strong>,
            a reset link is on its way. It expires in 1 hour.
          </p>
          <Link
            href="/login"
            className="text-[13px] text-accent font-medium hover:underline"
          >
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-heading text-[24px] text-text-primary mb-2">
            Reset your password
          </h1>
          <p className="text-[13.5px] text-text-secondary mb-6 leading-relaxed">
            Enter your email and we&apos;ll send you a reset link if an account
            exists.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} method="post" noValidate>
            <div className="mb-5">
              <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
                Email address
              </label>
              <Input
                type="email"
                placeholder="olumide@gmail.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-[11.5px] text-red mt-[5px]">
                  {errors.email.message}
                </p>
              )}
            </div>

            {errors.root && (
              <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Send reset link →
            </Button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
