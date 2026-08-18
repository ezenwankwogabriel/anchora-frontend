const COOKIE_NAME = "anchora_acquisition";
const COOKIE_DAYS = 30;

export interface AcquisitionData {
  acquisitionSource: string | null;
  acquisitionMedium: string | null;
  acquisitionCampaign: string | null;
  acquisitionContent: string | null;
  landingPage: string;
  firstTouchAt: string;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? match[1] : null;
}

function writeCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Lax`;
}

// Idempotent, first-touch only — mirrors anchora-website's lib/acquisition.ts.
// Prefers the acq_* handoff params from the marketing site's CTA link; falls
// back to independent UTM/referrer capture for direct entry (e.g. a paid
// campaign linking straight to /signup without visiting the marketing site).
export function captureAcquisition(): AcquisitionData | null {
  if (typeof window === "undefined") return null;

  const existing = readCookie(COOKIE_NAME);
  if (existing) {
    try {
      return JSON.parse(decodeURIComponent(existing)) as AcquisitionData;
    } catch {
      // Corrupt cookie value — fall through and recapture.
    }
  }

  const params = new URLSearchParams(window.location.search);
  const hasHandoff =
    params.has("acq_source") ||
    params.has("acq_medium") ||
    params.has("acq_campaign") ||
    params.has("acq_content") ||
    params.has("acq_landing_page");

  let data: AcquisitionData;

  if (hasHandoff) {
    data = {
      acquisitionSource: params.get("acq_source"),
      acquisitionMedium: params.get("acq_medium"),
      acquisitionCampaign: params.get("acq_campaign"),
      acquisitionContent: params.get("acq_content"),
      landingPage:
        params.get("acq_landing_page") ??
        window.location.pathname + window.location.search,
      firstTouchAt: params.get("acq_first_touch_at") ?? new Date().toISOString(),
    };
  } else {
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");
    const utmContent = params.get("utm_content");
    const hasUtm = Boolean(utmSource || utmMedium || utmCampaign || utmContent);

    data = {
      acquisitionSource: hasUtm ? utmSource : document.referrer || null,
      acquisitionMedium: hasUtm ? utmMedium : null,
      acquisitionCampaign: hasUtm ? utmCampaign : null,
      acquisitionContent: hasUtm ? utmContent : null,
      landingPage: window.location.pathname + window.location.search,
      firstTouchAt: new Date().toISOString(),
    };
  }

  writeCookie(COOKIE_NAME, encodeURIComponent(JSON.stringify(data)), COOKIE_DAYS);
  return data;
}
