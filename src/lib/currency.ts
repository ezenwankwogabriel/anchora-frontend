export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(koboToNaira(kobo));
}

// Strips a currency input down to plain digits + at most one decimal point,
// suitable for Number()/nairaToKobo. Tolerates pasted commas, stray symbols.
export function sanitizeNairaInput(raw: string): string {
  const digitsAndDots = raw.replace(/[^\d.]/g, "");
  const [intPart, ...rest] = digitsAndDots.split(".");
  return rest.length === 0 ? intPart : `${intPart}.${rest.join("")}`;
}

// Adds thousand separators for display while typing, preserving a trailing
// decimal point (e.g. "1234." or "1234.5") so formatting doesn't fight the
// user mid-keystroke. Pair with sanitizeNairaInput() to get back a plain
// numeric string for storage/submission.
export function formatNairaInputDisplay(raw: string): string {
  if (!raw) return "";
  const [intPart, decimalPart] = sanitizeNairaInput(raw).split(".");
  const formattedInt = intPart ? Number(intPart).toLocaleString("en-NG") : "";
  return decimalPart === undefined ? formattedInt : `${formattedInt}.${decimalPart}`;
}

// Converts a raw currency-input string to kobo for submission — or `null`
// if the field is empty or the string doesn't resolve to a valid number
// (e.g. a stray "." left over from clearing digit-by-digit). Returning
// `null` rather than silently omitting the field is what makes clearing an
// existing value actually persist as a clear, not a no-op — the backend
// distinguishes "field omitted" (undefined, no change) from "field cleared"
// (null, remove the value).
export function parseNairaInputToKobo(raw: string): number | null {
  const sanitized = sanitizeNairaInput(raw);
  if (!sanitized) return null;
  const naira = Number(sanitized);
  if (!Number.isFinite(naira)) return null;
  return nairaToKobo(naira);
}
