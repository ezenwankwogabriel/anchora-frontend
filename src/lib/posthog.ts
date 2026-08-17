import posthog from "posthog-js";

let initialized = false;

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
  if (handoffId) posthog.identify(handoffId);
}

export { posthog };
