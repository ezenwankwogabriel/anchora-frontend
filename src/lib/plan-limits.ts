export const FREE_TRUSTED_CONTACT_LIMIT = 1;
export const PRO_TRUSTED_CONTACT_LIMIT = 3;

export function trustedContactLimitFor(isPro: boolean): number {
  return isPro ? PRO_TRUSTED_CONTACT_LIMIT : FREE_TRUSTED_CONTACT_LIMIT;
}
