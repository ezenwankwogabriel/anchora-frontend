"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BeneficiaryService } from "@/services/beneficiary.service";
import { useAuthStore } from "@/stores/authStore";
import type { Relationship } from "@/lib/types";
import { RELATIONSHIPS, RELATIONSHIP_LABELS } from "@/lib/schemas/beneficiary";

const ONBOARDING_KEY = "onboardingCompleted";

function finish(router: ReturnType<typeof useRouter>) {
  localStorage.setItem(ONBOARDING_KEY, "true");
  router.push("/dashboard");
}

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<Relationship | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const skip = () => finish(router);

  const submitBeneficiary = async () => {
    if (!name.trim() || !email.trim() || !relationship) return;
    setSubmitting(true);
    setApiError(null);
    try {
      await BeneficiaryService.create({
        name: name.trim(),
        email: email.trim(),
        relationship: relationship as Relationship,
        isDefault: true,
      });
      finish(router);
    } catch {
      setApiError(
        "Something went wrong. You can skip and add a beneficiary from your dashboard."
      );
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-4 flex-shrink-0">
          <Image
            src="/images/logo-full-transparent.png"
            alt="Anchora"
            width={80}
            height={32}
            className="object-contain"
          />
          {step > 0 && (
            <button
              onClick={skip}
              className="text-[13px] text-text-secondary hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none font-sans"
            >
              Skip
            </button>
          )}
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-1 mb-10 flex-shrink-0">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-6 bg-accent"
                  : i < step
                  ? "w-1.5 bg-accent/40"
                  : "w-1.5 bg-border-color"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex items-start justify-center px-4 sm:px-6 pb-16">
          <div className="w-full max-w-[480px]">
            {step === 0 && (
              <ScreenWhy firstName={user?.firstName} onNext={() => setStep(1)} />
            )}
            {step === 1 && (
              <ScreenHowItWorks onBack={() => setStep(0)} onNext={() => setStep(2)} />
            )}
            {step === 2 && (
              <ScreenExpectations onBack={() => setStep(1)} onNext={() => setStep(3)} />
            )}
            {step === 3 && (
              <ScreenBeneficiary
                name={name}
                email={email}
                relationship={relationship}
                submitting={submitting}
                apiError={apiError}
                onNameChange={setName}
                onEmailChange={setEmail}
                onRelationshipChange={setRelationship}
                onBack={() => setStep(2)}
                onSubmit={submitBeneficiary}
                onSkip={skip}
              />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// ── Screen 0: The "why" ────────────────────────────────────────────────────

function ScreenWhy({
  firstName,
  onNext,
}: {
  firstName?: string;
  onNext: () => void;
}) {
  return (
    <div>
      {firstName && (
        <p className="text-[13.5px] text-text-secondary mb-3">
          Welcome, {firstName}
        </p>
      )}
      <h1 className="font-heading text-[32px] sm:text-[38px] leading-[1.2] text-text-primary mb-5">
        Your financial life is complex.{" "}
        <span className="text-accent">
          Make sure the people you love can find what they need.
        </span>
      </h1>
      <p className="text-[15px] text-text-secondary leading-relaxed mb-10">
        If something happened to you today, would your family know where your
        accounts are, who to call, or how to access what&apos;s theirs?
        Anchora exists to make sure they do.
      </p>
      <Button size="lg" onClick={onNext}>
        Get started →
      </Button>
    </div>
  );
}

// ── Screen 1: How it works ─────────────────────────────────────────────────

const HOW_STEPS = [
  {
    icon: <VaultIcon />,
    title: "Store",
    desc: "Add your financial accounts across up to 7 categories — banks, crypto, pensions, and more.",
  },
  {
    icon: <UsersIcon />,
    title: "Designate",
    desc: "Choose who receives access when it matters most. You stay in full control until then.",
  },
  {
    icon: <ShieldIcon />,
    title: "Rest easy",
    desc: "Anchora's inactivity engine monitors your account and triggers a secure, staged release automatically.",
  },
];

function ScreenHowItWorks({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <p className="text-[13px] text-text-tertiary uppercase tracking-wider font-semibold mb-3">
        How it works
      </p>
      <h2 className="font-heading text-[28px] sm:text-[32px] leading-[1.2] text-text-primary mb-8">
        Three steps to protect your family
      </h2>
      <div className="flex flex-col gap-5 mb-10">
        {HOW_STEPS.map((s) => (
          <div key={s.title} className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent mt-0.5">
              {s.icon}
            </div>
            <div>
              <p className="font-semibold text-[15px] text-text-primary mb-0.5">
                {s.title}
              </p>
              <p className="text-[13.5px] text-text-secondary leading-relaxed">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext}>Continue →</Button>
      </div>
    </div>
  );
}

// ── Screen 2: Set expectations ─────────────────────────────────────────────

const EXPECTATIONS = [
  "Takes about 15 minutes to complete setup",
  "Save your progress and return anytime — nothing is lost",
  "Nothing is shared until you're gone and your family needs it",
];

function ScreenExpectations({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <p className="text-[13px] text-text-tertiary uppercase tracking-wider font-semibold mb-3">
        Before you start
      </p>
      <h2 className="font-heading text-[28px] sm:text-[32px] leading-[1.2] text-text-primary mb-8">
        Here&apos;s what setup looks like
      </h2>
      <div className="flex flex-col gap-4 mb-10">
        {EXPECTATIONS.map((text) => (
          <div key={text} className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckIcon />
            </div>
            <p className="text-[14.5px] text-text-primary leading-relaxed">
              {text}
            </p>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext}>I&apos;m ready →</Button>
      </div>
    </div>
  );
}

// ── Screen 3: First beneficiary ────────────────────────────────────────────

function ScreenBeneficiary({
  name,
  email,
  relationship,
  submitting,
  apiError,
  onNameChange,
  onEmailChange,
  onRelationshipChange,
  onBack,
  onSubmit,
  onSkip,
}: {
  name: string;
  email: string;
  relationship: Relationship | "";
  submitting: boolean;
  apiError: string | null;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onRelationshipChange: (v: Relationship) => void;
  onBack: () => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  const valid = name.trim().length > 0 && email.trim().length > 0 && relationship !== "";

  return (
    <div>
      <p className="text-[13px] text-text-tertiary uppercase tracking-wider font-semibold mb-3">
        First step
      </p>
      <h2 className="font-heading text-[28px] sm:text-[32px] leading-[1.2] text-text-primary mb-2">
        Who should receive access?
      </h2>
      <p className="text-[14px] text-text-secondary mb-8">
        Add your primary beneficiary now. You can add more later.
      </p>

      <div className="flex flex-col gap-4 mb-5">
        <div>
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
            Full name
          </label>
          <Input
            type="text"
            placeholder="Emeka Okafor"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
            Email address
          </label>
          <Input
            type="email"
            placeholder="emeka@gmail.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
            Relationship
          </label>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIPS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRelationshipChange(r)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors cursor-pointer ${
                  relationship === r
                    ? "bg-accent text-white border-accent"
                    : "bg-surface text-text-secondary border-border-color hover:border-accent/50 hover:text-text-primary"
                }`}
              >
                {RELATIONSHIP_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {apiError && (
        <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
          {apiError}
        </p>
      )}

      <div className="flex gap-3 mb-4">
        <Button variant="secondary" onClick={onBack} disabled={submitting}>
          ← Back
        </Button>
        <Button onClick={onSubmit} disabled={!valid || submitting}>
          {submitting && <Loader2 size={15} className="animate-spin" />}
          Add beneficiary →
        </Button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="text-[13px] text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer bg-transparent border-none font-sans"
      >
        Skip this step
      </button>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

function VaultIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
