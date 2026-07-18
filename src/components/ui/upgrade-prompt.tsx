import Link from "next/link";
import { Button } from "./button";

interface UpgradePromptProps {
  feature: string;
  description: string;
}

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  return (
    <div className="border border-navy/20 bg-navy/5 rounded-xl p-5">
      <p className="font-semibold text-[14px] text-text-primary mb-1">{feature}</p>
      <p className="text-[13px] text-text-secondary mb-4">{description}</p>
      <Link href="/settings/upgrade">
        <Button size="sm">Upgrade to Pro</Button>
      </Link>
    </div>
  );
}
