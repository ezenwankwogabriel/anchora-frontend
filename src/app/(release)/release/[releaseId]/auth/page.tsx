"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { AuthService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/authStore";
import { ServiceError } from "@/lib/types";

// Generic resolver cast that works across both schemas
const zodResolver = _zodResolver as unknown as <T extends object>(
  schema: z.ZodType<T>
) => Resolver<T>;

// ── Schemas ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().min(1, "Required").email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});

const registerSchema = z
  .object({
    firstName:       z.string().min(1, "Required"),
    lastName:        z.string().min(1, "Required"),
    email:           z.string().min(1, "Required").email("Enter a valid email"),
    password:        z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginFormData    = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// ── Shared helpers ────────────────────────────────────────────────────────────

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
      {text}{required && " *"}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11.5px] text-red mt-[5px]">{message}</p>;
}

function RootError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
      {message}
    </p>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm({ releaseId }: { releaseId: string }) {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormData) => {
    try {
      const { user, accessToken } = await AuthService.login(values);
      setAuth(user, accessToken);
      router.push(`/release/${releaseId}`);
    } catch (err) {
      setError("root", {
        message: err instanceof ServiceError ? err.message : "Invalid email or password",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection>
        <FieldLabel text="Email" required />
        <Input type="email" placeholder="you@example.com" {...register("email")} />
        <FieldError message={errors.email?.message} />
      </FormSection>

      <FormSection>
        <FieldLabel text="Password" required />
        <Input type="password" placeholder="••••••••" {...register("password")} />
        <FieldError message={errors.password?.message} />
      </FormSection>

      <RootError message={errors.root?.message} />

      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        Sign in →
      </Button>
    </form>
  );
}

// ── Register form ─────────────────────────────────────────────────────────────

function RegisterForm({ releaseId }: { releaseId: string }) {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormData) => {
    try {
      await AuthService.register({
        firstName: values.firstName,
        lastName:  values.lastName,
        email:     values.email,
        password:  values.password,
      });
      // Auto-login after registration
      const { user, accessToken } = await AuthService.login({
        email:    values.email,
        password: values.password,
      });
      setAuth(user, accessToken);
      router.push(`/release/${releaseId}`);
    } catch (err) {
      setError("root", {
        message: err instanceof ServiceError ? err.message : "Could not create account",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-2 gap-3">
        <FormSection className="mb-0">
          <FieldLabel text="First name" required />
          <Input placeholder="Jane" {...register("firstName")} />
          <FieldError message={errors.firstName?.message} />
        </FormSection>
        <FormSection className="mb-0">
          <FieldLabel text="Last name" required />
          <Input placeholder="Smith" {...register("lastName")} />
          <FieldError message={errors.lastName?.message} />
        </FormSection>
      </div>

      <FormSection className="mt-4">
        <FieldLabel text="Email" required />
        <Input type="email" placeholder="you@example.com" {...register("email")} />
        <FieldError message={errors.email?.message} />
      </FormSection>

      <FormSection>
        <FieldLabel text="Password" required />
        <Input type="password" placeholder="Min. 8 characters" {...register("password")} />
        <FieldError message={errors.password?.message} />
      </FormSection>

      <FormSection>
        <FieldLabel text="Confirm password" required />
        <Input type="password" placeholder="••••••••" {...register("confirmPassword")} />
        <FieldError message={errors.confirmPassword?.message} />
      </FormSection>

      <RootError message={errors.root?.message} />

      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        Create account →
      </Button>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type AuthTab = "register" | "login";

export default function ReleaseAuthPage() {
  const params    = useParams();
  const releaseId = params.releaseId as string;
  const [tab, setTab] = useState<AuthTab>("register");

  return (
    <div className="bg-surface rounded-xl border border-border-color p-8">
      <h1 className="font-heading text-[26px] text-text-primary mb-1 text-center">
        Access your release report
      </h1>
      <p className="text-[13.5px] text-text-secondary text-center mb-6">
        Sign in or create an account to continue.
      </p>

      {/* Tab switcher */}
      <div className="flex border-b border-border-color mb-6">
        {(["register", "login"] as AuthTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[13.5px] font-[500] transition-colors border-b-2 -mb-px capitalize ${
              tab === t
                ? "border-accent text-accent font-semibold"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t === "register" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>

      {tab === "login"    && <LoginForm    releaseId={releaseId} />}
      {tab === "register" && <RegisterForm releaseId={releaseId} />}

      <p className="text-[11.5px] text-text-tertiary text-center mt-5 leading-relaxed">
        You&apos;re accessing a release report. Your account will be created on Anchora and is
        separate from the vault owner&apos;s account.
      </p>
    </div>
  );
}
