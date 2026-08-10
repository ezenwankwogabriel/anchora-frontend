"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Info } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryPillPicker } from "@/components/onboarding/category-pill-picker";
import { CategoryIcon, categoryLabels } from "@/components/ui/category-icon";
import { VaultForm } from "@/components/vault/vault-form";
import { ExecutorService } from "@/services/executor.service";
import { AuthService } from "@/services/auth.service";
import { VaultService } from "@/services/vault.service";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import type { AssetCategory, VaultRecordInput } from "@/lib/types";

async function finish(
  router: ReturnType<typeof useRouter>,
  categories: AssetCategory[],
) {
  await AuthService.completeOnboarding(categories);
  useAuthStore.getState().updateUser({ onboardingSelectedCategories: categories });
  router.push("/dashboard");
}

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notifyNow, setNotifyNow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [firstAssetCategory, setFirstAssetCategory] = useState<AssetCategory | null>(null);
  const [assetApiError, setAssetApiError] = useState<string | null>(null);

  const toggleCategory = (cat: AssetCategory) =>
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  // Nothing to seed if the user picked no categories — skip straight to the executor step.
  const continueFromCategories = () => setStep(categories.length > 0 ? 4 : 5);
  const backToExecutorPrevious = () => setStep(categories.length > 0 ? 4 : 3);

  const skip = () => finish(router, categories);

  const createFirstAsset = async (data: VaultRecordInput, files: File[]) => {
    setAssetApiError(null);
    try {
      const record = await VaultService.createRecord(data);
      if (record && files.length > 0) {
        await Promise.allSettled(
          files.map((file) => VaultService.uploadDocument(record.id, file)),
        );
      }
      setStep(5);
    } catch {
      setAssetApiError(
        "Something went wrong saving that asset. You can skip and add it later from your vault."
      );
    }
  };

  const submitExecutor = async () => {
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const executor = await ExecutorService.create({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        relationship: relationship.trim() || undefined,
      });
      if (notifyNow) {
        try {
          await ExecutorService.notify(executor.id);
        } catch {
          // Best-effort: the trusted contact is designated either way,
          // so a failed notify shouldn't block finishing onboarding.
        }
      }
      await finish(router, categories);
    } catch {
      setApiError(
        "Something went wrong. You can skip and designate a trusted contact from your dashboard."
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
          {[0, 1, 2, 3, 4, 5].map((i) => (
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
              <ScreenCategories
                selected={categories}
                onToggle={toggleCategory}
                onBack={() => setStep(2)}
                onNext={continueFromCategories}
              />
            )}
            {step === 4 && (
              <ScreenFirstAsset
                categories={categories}
                selectedCategory={
                  firstAssetCategory && categories.includes(firstAssetCategory)
                    ? firstAssetCategory
                    : categories[0] ?? null
                }
                onSelectCategory={setFirstAssetCategory}
                apiError={assetApiError}
                onBack={() => setStep(3)}
                onSubmit={createFirstAsset}
                onSkip={() => setStep(5)}
              />
            )}
            {step === 5 && (
              <ScreenExecutor
                name={name}
                email={email}
                phone={phone}
                relationship={relationship}
                notifyNow={notifyNow}
                submitting={submitting}
                apiError={apiError}
                onNameChange={setName}
                onEmailChange={setEmail}
                onPhoneChange={setPhone}
                onRelationshipChange={setRelationship}
                onNotifyNowChange={setNotifyNow}
                onBack={backToExecutorPrevious}
                onSubmit={submitExecutor}
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
      <h1 className="font-heading text-[32px] sm:text-[38px] leading-[1.2] text-text-primary mb-5">
        Welcome{firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="text-[15px] text-text-secondary leading-relaxed mb-4">
        Most people never write down where their accounts are, who to contact, or
        what steps to take. That gap is what causes chaos when it matters most.
      </p>
      <p className="text-[15px] text-text-secondary leading-relaxed mb-10">
        Anchora helps you document what you have, so your Trusted Contact isn&apos;t
        left guessing. They&apos;ll know exactly where to start and how to navigate
        the process, when the time comes.
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
    desc: "Add your financial accounts across 11 categories (banks, crypto, pensions, and more).",
  },
  {
    icon: <UsersIcon />,
    title: "Designate",
    desc: "Choose a Trusted Contact who will be guided through the process on behalf of your loved ones.",
  },
  {
    icon: <ShieldIcon />,
    title: "Rest easy",
    desc: "Anchora's inactivity engine automatically notifies your Trusted Contact if you become inactive, starting a guided, staged process.",
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
  "Takes about 5 minutes to get started",
  "Save your progress and pick up anytime, nothing is lost",
  "Your information stays private and is only accessible to your Trusted Contact if you become inactive for an extended period",
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

// ── Screen 3: Category selection ──────────────────────────────────────────

function ScreenCategories({
  selected,
  onToggle,
  onBack,
  onNext,
}: {
  selected: AssetCategory[];
  onToggle: (category: AssetCategory) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <p className="text-[13px] text-text-tertiary uppercase tracking-wider font-semibold mb-3">
        Tell us what you have
      </p>
      <h2 className="font-heading text-[28px] sm:text-[32px] leading-[1.2] text-text-primary mb-2">
        What do you want to protect?
      </h2>
      <p className="text-[14px] text-text-secondary mb-8">
        Pick everything that applies. You can add the details later. Nothing
        here is final.
      </p>

      <div className="mb-10">
        <CategoryPillPicker selected={selected} onToggle={onToggle} />
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

// ── Screen 4: Add first asset ─────────────────────────────────────────────

function ScreenFirstAsset({
  categories,
  selectedCategory,
  onSelectCategory,
  apiError,
  onBack,
  onSubmit,
  onSkip,
}: {
  categories: AssetCategory[];
  selectedCategory: AssetCategory | null;
  onSelectCategory: (category: AssetCategory) => void;
  apiError: string | null;
  onBack: () => void;
  onSubmit: (data: VaultRecordInput, files: File[]) => Promise<void>;
  onSkip: () => void;
}) {
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  if (!selectedCategory) return null;

  return (
    <div>
      <p className="text-[13px] text-text-tertiary uppercase tracking-wider font-semibold mb-3">
        Let&apos;s add your first asset
      </p>
      <h2 className="font-heading text-[28px] sm:text-[32px] leading-[1.2] text-text-primary mb-2">
        Ready to log one?
      </h2>
      <p className="text-[14px] text-text-secondary mb-6">
        Pick one of the categories you just selected, and we&apos;ll walk you
        through it.
      </p>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => {
            const isSelected = cat === selectedCategory;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={cn(
                  "flex items-center gap-2 pl-3 pr-4 py-2 rounded-full border-[1.5px] transition-colors",
                  isSelected
                    ? "border-accent bg-[#EFF6FF] text-accent"
                    : "border-border-color text-text-primary hover:border-accent hover:bg-surface-2"
                )}
              >
                <CategoryIcon category={cat} size={14} className="w-6 h-6" />
                <span className="text-[13px] font-semibold">{categoryLabels[cat]}</span>
              </button>
            );
          })}
        </div>
      )}

      {categories.length === 1 && (
        <div className="flex items-center gap-3 mb-8 pb-5 border-b border-border-color">
          <CategoryIcon category={selectedCategory} size={16} />
          <p className="text-[13px] font-semibold text-text-primary">
            {categoryLabels[selectedCategory]}
          </p>
        </div>
      )}

      {apiError && (
        <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
          {apiError}
        </p>
      )}

      <VaultForm
        category={selectedCategory}
        onSubmit={(data) => onSubmit(data, stagedFiles)}
        onCancel={onBack}
        submitLabel="Save asset →"
        hideCancel
        stagedFiles={stagedFiles}
        onStagedFilesChange={setStagedFiles}
      />

      <div className="flex gap-3 mt-4">
        <Button variant="secondary" onClick={onBack}>
          ← Back
        </Button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="text-[13px] text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer bg-transparent border-none font-sans mt-4"
      >
        Skip this step
      </button>
    </div>
  );
}

// ── Screen 5: Designate executor ──────────────────────────────────────────

function ScreenExecutor({
  name,
  email,
  phone,
  relationship,
  notifyNow,
  submitting,
  apiError,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onRelationshipChange,
  onNotifyNowChange,
  onBack,
  onSubmit,
  onSkip,
}: {
  name: string;
  email: string;
  phone: string;
  relationship: string;
  notifyNow: boolean;
  submitting: boolean;
  apiError: string | null;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onRelationshipChange: (v: string) => void;
  onNotifyNowChange: (v: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  const valid = name.trim().length > 0 && email.trim().length > 0;

  return (
    <div>
      <p className="text-[13px] text-text-tertiary uppercase tracking-wider font-semibold mb-3">
        Final step
      </p>
      <h2 className="font-heading text-[28px] sm:text-[32px] leading-[1.2] text-text-primary mb-2">
        Designate your Trusted Contact
      </h2>
      <p className="text-[14px] text-text-secondary mb-8">
        Choose a trusted contact (a lawyer, family member, or close friend) who will
        receive your release summary and guidance on next steps.
      </p>

      <div className="flex items-start gap-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 mb-5">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-[1px]" />
        <p className="text-[13px] text-blue-800">
          Saving this never sends an email on its own. Choose below if
          you&apos;d like to notify your trusted contact right away, or do it later
          from your dashboard.
        </p>
      </div>

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
            Phone number
          </label>
          <Input
            type="tel"
            placeholder="+234 800 000 0000"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
            Relationship
          </label>
          <Input
            type="text"
            placeholder="e.g. Spouse, sibling, lawyer"
            value={relationship}
            onChange={(e) => onRelationshipChange(e.target.value)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px] text-text-secondary mb-4">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={notifyNow}
          onChange={(e) => onNotifyNowChange(e.target.checked)}
        />
        Notify my trusted contact by email now
      </label>

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
          Designate trusted contact →
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
