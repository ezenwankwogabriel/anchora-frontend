import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { InactivityBanner } from "@/components/ui/inactivity-banner";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Download, Trash2, ArrowRight } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-text-tertiary mb-4 pb-2 border-b border-border-color">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({
  color,
  label,
  value,
  border,
}: {
  color: string;
  label: string;
  value: string;
  border?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`h-14 rounded-lg ${border ? "border border-border-color" : ""}`}
        style={{ background: color }}
      />
      <p className="text-[12px] font-semibold text-text-primary">{label}</p>
      <p className="text-[11px] text-text-tertiary">{value}</p>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[900px] mx-auto py-12 px-8">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-accent mb-2">
            Sprint 1 · Design System
          </p>
          <h1 className="font-heading text-[40px] text-text-primary mb-3">
            Anchora Design System
          </h1>
          <p className="text-[14px] text-text-secondary max-w-[520px] leading-relaxed">
            Visual language for the Digital Financial Legacy Platform. All tokens,
            components, and typographic styles validated here before Sprint 2.
          </p>
        </div>

        {/* ── COLOUR ── */}
        <Section title="Colour Palette">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Swatch color="#F7F6F3" label="Background" value="#F7F6F3" border />
            <Swatch color="#FFFFFF" label="Surface" value="#FFFFFF" border />
            <Swatch color="#F2F1EE" label="Surface 2" value="#F2F1EE" border />
            <Swatch color="#E8E6E1" label="Border" value="#E8E6E1" border />
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Swatch color="#1A1915" label="Text Primary" value="#1A1915" />
            <Swatch color="#6B6860" label="Text Secondary" value="#6B6860" />
            <Swatch color="#9C9A96" label="Text Tertiary" value="#9C9A96" />
            <Swatch color="#D4D1CB" label="Border Strong" value="#D4D1CB" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Swatch color="#141B34" label="Accent (Navy)" value="#141B34" />
            <Swatch color="#1D7A4A" label="Success" value="#1D7A4A" />
            <Swatch color="#B45309" label="Warning" value="#B45309" />
            <Swatch color="#B91C1C" label="Error" value="#B91C1C" />
          </div>
          <div className="grid grid-cols-4 gap-4 mt-6">
            <Swatch color="#EBA73A" label="Gold" value="#EBA73A" />
          </div>
        </Section>

        {/* ── TYPOGRAPHY ── */}
        <Section title="Typography">
          <div className="flex flex-col gap-5 bg-surface border border-border-color rounded-xl p-6 shadow-sm">
            <div>
              <p className="text-[11px] text-text-tertiary mb-1">Cabinet Grotesk · 40px · heading</p>
              <p className="font-heading text-[40px] leading-tight text-text-primary">
                Financial Legacy
              </p>
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary mb-1">Cabinet Grotesk · 32px · page title</p>
              <p className="font-heading text-[32px] leading-tight text-text-primary">
                Your vault, secured.
              </p>
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary mb-1">Cabinet Grotesk · 24px · section title</p>
              <p className="font-heading text-[24px] text-text-primary">
                Beneficiary Management
              </p>
            </div>
            <div className="border-t border-border-color pt-4">
              <p className="text-[11px] text-text-tertiary mb-1">Figtree · 14px · 400 · body</p>
              <p className="text-[14px] text-text-primary leading-relaxed">
                Register your financial accounts and designate who gets access.
                Anchora ensures nothing is lost.
              </p>
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary mb-1">Figtree · 13.5px · 600 · label</p>
              <p className="text-[13.5px] font-semibold text-text-primary">
                Account Details
              </p>
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary mb-1">Figtree · 12.5px · 400 · caption</p>
              <p className="text-[12.5px] text-text-secondary">
                Last updated 3 days ago · 4 beneficiaries active
              </p>
            </div>
          </div>
        </Section>

        {/* ── BUTTONS ── */}
        <Section title="Button">
          <Card>
            <CardContent className="flex flex-wrap gap-3 items-center">
              <Button variant="primary">Primary</Button>
              <Button variant="primary">
                <Plus size={15} />
                Add Asset
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">
                <Trash2 size={15} />
                Delete
              </Button>
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="secondary" size="sm">Small</Button>
              <Button variant="primary" size="lg">
                Get Started
                <ArrowRight size={15} />
              </Button>
              <Button variant="primary" disabled>Disabled</Button>
            </CardContent>
          </Card>
          <Card className="mt-3">
            <CardContent>
              <Button variant="primary" fullWidth>
                Full-width · Create account
              </Button>
            </CardContent>
          </Card>
        </Section>

        {/* ── BADGES ── */}
        <Section title="Badge & StatusBadge">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Badge · pill labels</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Badge variant="success">Active</Badge>
                <Badge variant="warning">Pending</Badge>
                <Badge variant="error">Overdue</Badge>
                <Badge variant="info">Draft</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>StatusBadge · with dot indicator</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <StatusBadge variant="success" label="All clear" />
                <StatusBadge variant="warning" label="Action needed" />
                <StatusBadge variant="error" label="Release triggered" />
                <StatusBadge variant="info" label="In review" />
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ── FORM ELEMENTS ── */}
        <Section title="Form Elements">
          <Card>
            <CardContent className="flex flex-col gap-5">
              <div>
                <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
                  Full name
                </label>
                <Input placeholder="Olumide Adeyemi" />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
                  Password
                </label>
                <Input type="password" placeholder="At least 8 characters" />
                <p className="text-[11.5px] text-text-tertiary mt-[5px]">
                  Must include uppercase, number, and special character
                </p>
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
                  Notes
                </label>
                <Textarea placeholder="Any additional instructions for beneficiaries…" />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
                  Asset category
                </label>
                <Select>
                  <option value="">Select a category</option>
                  <option value="bank">Bank Account</option>
                  <option value="invest">Investment</option>
                  <option value="crypto">Crypto</option>
                  <option value="pension">Pension</option>
                  <option value="insurance">Insurance</option>
                </Select>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ── INACTIVITY BANNER ── */}
        <Section title="InactivityBanner">
          <div className="flex flex-col gap-3">
            <InactivityBanner
              variant="success"
              message={
                <>
                  <strong className="text-green">All clear.</strong> You checked
                  in 12 days ago. Next check-in due in 48 days.
                </>
              }
              ctaLabel="Check in now"
            />
            <InactivityBanner
              variant="warning"
              message={
                <>
                  <strong className="text-amber">Heads up.</strong> You haven&apos;t
                  checked in for 8 months. Please confirm you&apos;re still active.
                </>
              }
              ctaLabel="Confirm I'm active"
            />
            <InactivityBanner
              variant="error"
              message={
                <>
                  <strong className="text-red">Action required.</strong> 9-month
                  inactivity threshold reached. Release process starting in 7 days.
                </>
              }
              ctaLabel="Abort release"
            />
          </div>
        </Section>

        {/* ── PAGE HEADER ── */}
        <Section title="PageHeader">
          <Card>
            <CardContent>
              <PageHeader
                title="Beneficiaries"
                subtitle="Manage your Trusted Contact"
                actions={
                  <>
                    <Button variant="secondary" size="sm">
                      <Download size={14} />
                      Export
                    </Button>
                    <Button variant="primary" size="sm">
                      <Plus size={14} />
                      Add beneficiary
                    </Button>
                  </>
                }
              />
            </CardContent>
          </Card>
        </Section>

        {/* ── CARDS ── */}
        <Section title="Card">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Bank Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-[28px] text-text-primary leading-none mb-1">
                  3
                </p>
                <p className="text-[12px] text-text-secondary">records added</p>
                <StatusBadge variant="success" label="Complete" className="mt-3" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Beneficiaries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-[28px] text-text-primary leading-none mb-1">
                  2
                </p>
                <p className="text-[12px] text-text-secondary">designated</p>
                <StatusBadge variant="warning" label="Needs review" className="mt-3" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Vault Health</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-[28px] text-text-primary leading-none mb-1">
                  68%
                </p>
                <p className="text-[12px] text-text-secondary">complete</p>
                <StatusBadge variant="info" label="In progress" className="mt-3" />
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Sprint sign-off */}
        <div className="border-t border-border-color pt-8 flex items-center justify-between">
          <div>
            <p className="text-[12px] text-text-tertiary">Sprint 1 · Design System Validation</p>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              Next.js 14 · Tailwind CSS · shadcn/ui · Cabinet Grotesk + Figtree
            </p>
          </div>
          <StatusBadge variant="success" label="Build passing" />
        </div>
      </div>
    </div>
  );
}
