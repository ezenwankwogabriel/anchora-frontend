"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ExternalLink } from "lucide-react";
import { AdminService } from "@/services/admin.service";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { StatusBadge } from "@/components/ui/status-badge";
import { ServiceError } from "@/lib/types";
import type { DevUserState, InactivityStatus } from "@/lib/admin-types";

const STATUSES: InactivityStatus[] = ["ACTIVE", "NOTIFIED", "RELEASING"];

const STATUS_VARIANT: Record<InactivityStatus, "success" | "warning" | "error"> = {
  ACTIVE:    "success",
  NOTIFIED:  "warning",
  RELEASING: "error",
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StateCard({ state }: { state: DevUserState }) {
  return (
    <div className="bg-surface border border-border-color rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-[600] text-text-primary">{state.email}</p>
          <p className="text-[11.5px] text-text-tertiary font-mono mt-0.5">{state.userId}</p>
        </div>
        <StatusBadge
          variant={STATUS_VARIANT[state.inactivityStatus]}
          label={state.inactivityStatus}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1 border-t border-border-color">
        <Row label="Notified at" value={fmt(state.notifiedAt)} />
        <Row label="Last activity" value={fmt(state.lastActivityAt)} />
        <Row
          label="Active release"
          value={
            state.activeRelease ? (
              <Link
                href={`/admin/releases/${state.activeRelease.id}`}
                className="flex items-center gap-1 text-accent hover:underline"
              >
                {state.activeRelease.status}
                <ExternalLink size={11} />
              </Link>
            ) : (
              "None"
            )
          }
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-text-tertiary uppercase tracking-wide">{label}</span>
      <span className="text-[13px] text-text-primary">{value}</span>
    </div>
  );
}

export default function DevToolsPage() {
  const { isAuthenticated } = useAdminAuth();

  const [query, setQuery]       = useState("");
  const [state, setState]       = useState<DevUserState | null>(null);
  const [loading, setLoading]   = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  // Set-stage controls
  const [selectedStatus, setSelectedStatus] = useState<InactivityStatus>("NOTIFIED");
  const [backdateDays, setBackdateDays]   = useState("");

  if (process.env.NEXT_PUBLIC_DEV_TOOLS !== "true") return null;
  if (!isAuthenticated) return null;

  function clearFeedback() {
    setActionMsg(null);
    setError(null);
  }

  async function handleLoad() {
    if (!query.trim()) return;
    clearFeedback();
    setLoading(true);
    try {
      const s = await AdminService.devGetUserState(query.trim());
      setState(s);
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : "Failed to load user.");
    } finally {
      setLoading(false);
    }
  }

  async function withAction(label: string, fn: () => Promise<DevUserState>) {
    clearFeedback();
    setLoading(true);
    try {
      const s = await fn();
      setState(s);
      setActionMsg(`✓ ${label} completed.`);
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : `${label} failed.`);
    } finally {
      setLoading(false);
    }
  }

  function handleSetStatus() {
    if (!state) return;
    const days = backdateDays ? parseInt(backdateDays, 10) : undefined;
    withAction(
      "Set status",
      () => AdminService.devSetStatus(state.userId, selectedStatus, days),
    );
  }

  function handleRunCheck() {
    if (!state) return;
    withAction("Inactivity check", () =>
      AdminService.devRunInactivityCheck(state.userId),
    );
  }

  function handleReset() {
    if (!state) return;
    if (!window.confirm(`Reset ${state.email} to NONE and cancel any active release?`)) return;
    withAction("Reset", () => AdminService.devResetUser(state.userId));
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-[18px] font-[600] text-text-primary">Dev Tools</h1>
        <p className="text-[13px] text-text-tertiary mt-1">
          Manipulate inactivity state to test the release flow without waiting 90+ days.
        </p>
      </div>

      {/* User lookup */}
      <section className="bg-surface border border-border-color rounded-xl p-5 space-y-3">
        <p className="text-[13px] font-[600] text-text-secondary">Load user</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="User ID or email address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            className="flex-1 px-3 py-2 rounded-lg border border-border-color bg-bg text-[13.5px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            onClick={handleLoad}
            disabled={loading || !query.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-white text-[13px] font-[500] disabled:opacity-40 hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Load
          </button>
        </div>
      </section>

      {/* State card */}
      {state && <StateCard state={state} />}

      {/* Actions — only shown once a user is loaded */}
      {state && (
        <section className="bg-surface border border-border-color rounded-xl p-5 space-y-4">
          <p className="text-[13px] font-[600] text-text-secondary">Actions</p>

          {/* Set stage */}
          <div className="flex flex-wrap items-end gap-3 pb-4 border-b border-border-color">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-text-tertiary uppercase tracking-wide">Stage</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as InactivityStatus)}
                className="px-3 py-2 rounded-lg border border-border-color bg-bg text-[13px] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-text-tertiary uppercase tracking-wide">
                Backdate days <span className="normal-case">(optional)</span>
              </label>
              <input
                type="number"
                placeholder="auto"
                value={backdateDays}
                onChange={(e) => setBackdateDays(e.target.value)}
                className="w-28 px-3 py-2 rounded-lg border border-border-color bg-bg text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <button
              onClick={handleSetStatus}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-border-color text-[13px] font-[500] text-text-primary hover:bg-bg/60 disabled:opacity-40 transition-colors"
            >
              Set status
            </button>
          </div>

          {/* Run check + Reset */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRunCheck}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-[13px] font-[500] disabled:opacity-40 hover:bg-accent/90 transition-colors"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              Run inactivity check
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-red-200 text-[13px] font-[500] text-red hover:bg-red-light disabled:opacity-40 transition-colors"
            >
              Reset user
            </button>
          </div>
        </section>
      )}

      {/* Feedback */}
      {actionMsg && (
        <p className="text-[13px] text-green font-[500]">{actionMsg}</p>
      )}
      {error && (
        <p className="text-[13px] text-red font-[500]">{error}</p>
      )}
    </div>
  );
}
