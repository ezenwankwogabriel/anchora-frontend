export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  emailVerified: boolean;
  mfaEnabled: boolean;
  reminderFrequencyDays?: number;
  inactivityWindowMonths?: number;
  onboardingCompletedAt: string | null;
  // Optional: older cached sessions predate this field, so it may be
  // missing from a locally-stored user object until the next login.
  onboardingSelectedCategories?: AssetCategory[];
  govIdVerificationStatus?: GovIdVerificationStatus;
  govIdVerifiedAt?: string | null;
}

export type AuthResponse =
  | {
      requiresMfa: true;
      tempToken: string;
    }
  | {
      requiresMfa: false;
      accessToken: string;
      refreshToken: string;
      sessionId: string;
      mfaConfigured: boolean;
      mfaGraceDaysRemaining: number;
    };

export interface RegisterResponse {
  message: string;
  userId: string;
}

export interface MfaLoginResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  mfaConfigured: boolean;
}

export interface MfaSetupResponse {
  qrCode: string;
  secret: string;
  recoveryCodes: string[];
}

// ── Vault ─────────────────────────────────────────────────────────────────

export type AssetCategory =
  | "BANK_ACCOUNT"
  | "INVESTMENT_PLATFORM"
  | "CRYPTO_WALLET"
  | "PENSION_PORTAL"
  | "INSURANCE_POLICY"
  | "FOREIGN_ACCOUNT"
  | "REAL_ESTATE"
  | "VEHICLE"
  | "JEWELRY_WATCHES"
  | "SHARE_CERTIFICATES"
  | "SUBSCRIPTION"
  | "OTHER";

export type ExecutorIntent = "LIQUIDATE" | "TRANSFER" | "HOLD" | "UNSPECIFIED";

export interface VaultRecord {
  id: string;
  userId: string;
  category: AssetCategory;
  institutionName: string;
  accountName: string | null;
  accountUrl: string | null;
  executorIntent: ExecutorIntent;
  intendedBeneficiary?: string;
  isSelfCustodied: boolean;
  estimatedValue: number | null; // kobo — encrypted at rest, decrypted on read
  encryptedFields: {
    credential?: string;
    referenceId?: string;
    notes?: string;
    accountType?: string;
  };
  beneficiary: {
    id: string;
    name: string;
    email: string;
    relationship: Relationship;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface VaultRecordInput {
  category: AssetCategory;
  institutionName: string;
  accountName?: string;
  accountUrl?: string;
  credential?: string;
  referenceId?: string;
  notes?: string;
  executorIntent?: ExecutorIntent;
  intendedBeneficiary?: string;
  isSelfCustodied?: boolean;
  accountType?: string;
  estimatedValue?: number | null; // kobo — null explicitly clears it
}

// Every key of VaultRecordInput (minus estimatedValue), forced present even
// though the source type marks most of them optional — so recordToInput
// below gets a compile error if a newly added field is forgotten, instead of
// silently dropping it from partial-update payloads.
type RecordToInputResult = {
  [K in Exclude<keyof VaultRecordInput, "estimatedValue">]-?: VaultRecordInput[K] | undefined;
};

// Canonical VaultRecord -> VaultRecordInput mapper, for callers that only
// mean to change one field (e.g. bulk value edits) but must resend the rest
// of a partial-update payload, since the backend treats an omitted field as
// "leave alone" and treats undefined-vs-included very differently for
// estimatedValue in particular. estimatedValue is deliberately excluded
// here — callers that use this are, by definition, overriding it themselves.
export function recordToInput(record: VaultRecord): VaultRecordInput {
  const input: RecordToInputResult = {
    category: record.category,
    institutionName: record.institutionName,
    accountName: record.accountName ?? undefined,
    accountUrl: record.accountUrl ?? undefined,
    credential: record.encryptedFields?.credential,
    referenceId: record.encryptedFields?.referenceId,
    notes: record.encryptedFields?.notes,
    executorIntent: record.executorIntent,
    intendedBeneficiary: record.intendedBeneficiary,
    isSelfCustodied: record.isSelfCustodied,
    accountType: record.encryptedFields?.accountType,
  };
  // Presence of every field was already checked above; this cast just
  // restores category/institutionName's non-optional-ness, which
  // RecordToInputResult widens to allow undefined uniformly.
  return input as VaultRecordInput;
}

export interface VaultDocument {
  id: string;
  vaultRecordId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

// ── Beneficiaries (shared vault only) ────────────────────────────────────────

export type BeneficiaryStatus =
  | "INVITED"
  | "ACCOUNT_CREATED"
  | "ACTIVE"
  | "ACCOUNT_DELETED";

export type Relationship =
  | "SPOUSE"
  | "PARENT"
  | "CHILD"
  | "SIBLING"
  | "FRIEND"
  | "LAWYER"
  | "OTHER";

export interface SharedVaultItem {
  id:           string;
  ownerName:    string;
  relationship: Relationship;
  status:       BeneficiaryStatus;
  linkedAt:     string;
  assetCount:   number;
}

// ── Executor ──────────────────────────────────────────

export interface Executor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
  invitedAt: string;
  removedAt?: string;
  notifiedAt: string | null;
  emailVerifiedAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutorInput {
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
}

export type ExecutorNotificationState = "NOT_NOTIFIED" | "NOTIFIED" | "VERIFIED";

// ── Errors ────────────────────────────────────────────────────────────────

// ── Plan ──────────────────────────────────────────────────────────────────────

export interface PlanLimits {
  maxVaultRecords: number;
  canDownloadReport: boolean;
  canConfigureInactivityWindow: boolean;
  executorReceivesReport: boolean;
}

export type RenewalStatus =
  | "current"
  | "expiring_soon"
  | "auto_charge_failed"
  | "expired"
  | null;

export interface BillingData {
  tier: "FREE" | "PRO";
  paidUntil: string | null;
  renewalStatus: RenewalStatus;
  cardLast4: string | null;
}

// Account-level government-ID verification (NIN + selfie, via Dojah),
// required once before an account can access any records released to it —
// the single verification mechanism for every use case. Synchronous check:
// no PENDING state.
export type GovIdVerificationStatus = "UNVERIFIED" | "VERIFIED" | "FAILED";

export interface IdentityStatus {
  status: GovIdVerificationStatus;
  verifiedAt: string | null;
}

// ── Errors ────────────────────────────────────────────────────────────────────

export class ServiceError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ServiceError";
  }
}
