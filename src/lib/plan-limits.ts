// Centralized tier-limit constants — avoid duplicating magic numbers
// across feature files (see FREE_RECORD_LIMIT duplication in
// vault/client.tsx and vault/add/client.tsx for the anti-pattern this
// file exists to prevent for new features).

export const FREE_TRUSTED_CONTACT_LIMIT = 1;
export const PRO_TRUSTED_CONTACT_LIMIT = 3;

export function trustedContactLimitFor(isPro: boolean): number {
  return isPro ? PRO_TRUSTED_CONTACT_LIMIT : FREE_TRUSTED_CONTACT_LIMIT;
}
