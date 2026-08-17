import posthog from "posthog-js";

let initialized = false;

// PostHog's own generated distinct_ids (anonymous or otherwise) are short
// alphanumeric/hyphen/underscore tokens. Bounding the accepted shape means a
// crafted ?ph_distinct_id= link can't smuggle arbitrary or oversized input
// into identify() — it can still name a real distinct_id, since that's the
// nature of a public, unsigned cross-domain handoff param, but this narrows
// the accepted values to what a legitimate handoff would ever produce.
const DISTINCT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

// No-ops if NEXT_PUBLIC_POSTHOG_KEY isn't configured. If the marketing site
// handed off its anonymous distinct_id (?ph_distinct_id=...), adopt it here
// so the landing pageview and this session resolve to one PostHog identity
// before we later call posthog.identify(userId) at signup completion.
export function initPostHog() {
  if (initialized || typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: false,
    persistence: "localStorage+cookie",
  });
  initialized = true;

  const handoffId = new URLSearchParams(window.location.search).get(
    "ph_distinct_id",
  );
  if (handoffId && DISTINCT_ID_PATTERN.test(handoffId)) {
    posthog.identify(handoffId);
  }
}

export { posthog };
