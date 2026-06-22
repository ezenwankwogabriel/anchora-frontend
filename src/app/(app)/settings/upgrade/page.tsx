"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { useAuthStore } from "@/stores/authStore";

function FeatureItem({ included, text }: { included: boolean; text: string }) {
  return (
    <li className="flex items-start gap-2">
      {included ? (
        <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-[2px]" />
      ) : (
        <X size={15} className="text-gray-300 flex-shrink-0 mt-[2px]" />
      )}
      <span className={`text-[13.5px] ${included ? "text-text-primary" : "text-text-tertiary"}`}>
        {text}
      </span>
    </li>
  );
}

export default function UpgradePage() {
  const { planData } = usePlan();
  const user = useAuthStore((s) => s.user);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const isCurrentlyPro = planData?.plan === "PRO";

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-[13px] font-medium text-navy mb-2">Upgrade your plan</p>
        <h1 className="font-heading text-3xl text-text-primary">Get more from Anchora</h1>
        <p className="text-text-secondary text-lg mt-2">
          Protect your full estate with unlimited assets, executor delivery, and downloadable reports.
        </p>
      </div>

      {/* Plan cards */}
      <div className="flex gap-6">
        {/* Free card */}
        <div className="flex-1 bg-surface border border-border-color rounded-xl shadow-sm p-6">
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
            Free
          </span>
          <p className="text-3xl font-bold text-text-primary mt-3">₦0</p>
          <p className="text-[13px] text-text-secondary">Always free</p>

          <ul className="mt-4 space-y-2">
            <FeatureItem included text="Up to 3 asset records" />
            <FeatureItem included text="All 7 asset categories" />
            <FeatureItem included text="Designate one executor" />
            <FeatureItem included text="Inactivity monitoring" />
            <FeatureItem included text="Manual check-in" />
            <FeatureItem included={false} text="Executor receives estate report" />
            <FeatureItem included={false} text="Downloadable estate summary" />
            <FeatureItem included={false} text="Configurable inactivity window" />
            <FeatureItem included={false} text="Unlimited asset records" />
          </ul>

          <Button variant="secondary" fullWidth disabled className="mt-6">
            {!isCurrentlyPro ? "Current plan" : "Free plan"}
          </Button>
        </div>

        {/* Pro card */}
        <div className="flex-1 bg-surface border-2 border-navy rounded-xl shadow-md p-6">
          <span className="bg-navy text-white text-xs font-medium px-3 py-1 rounded-full">
            Pro
          </span>
          <p className="text-3xl font-bold text-navy mt-3">₦2,500</p>
          <p className="text-[13px] text-text-secondary">per month</p>

          <ul className="mt-4 space-y-2">
            <FeatureItem included text="Unlimited asset records" />
            <FeatureItem included text="All 7 asset categories" />
            <FeatureItem included text="Designate one executor" />
            <FeatureItem included text="Full inactivity monitoring" />
            <FeatureItem included text="Manual check-in" />
            <FeatureItem included text="Executor receives estate report" />
            <FeatureItem included text="Downloadable estate summary" />
            <FeatureItem included text="Configurable inactivity window (6–24 mo)" />
            <FeatureItem included text="Priority email support" />
          </ul>

          {isCurrentlyPro ? (
            <Button fullWidth disabled className="mt-6">
              Current plan
            </Button>
          ) : (
            <Button fullWidth className="mt-6" onClick={() => setShowComingSoon(true)}>
              Upgrade to Pro
            </Button>
          )}
        </div>
      </div>

      <p className="text-[13px] text-text-secondary text-center mt-6">
        Questions? Contact us at hello@anchora.co
      </p>

      {/* Coming soon modal */}
      {showComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowComingSoon(false)} />
          <div className="relative bg-surface rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 text-center">
            <p className="text-[15px] font-semibold text-text-primary mb-2">Coming soon</p>
            <p className="text-[13px] text-text-secondary">
              Payment coming soon. We&apos;ll notify you at{" "}
              <span className="font-medium text-text-primary">{user?.email}</span>{" "}
              when Pro is available.
            </p>
            <Button className="mt-5" onClick={() => setShowComingSoon(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
