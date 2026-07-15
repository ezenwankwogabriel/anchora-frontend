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
  encryptedFields: {
    credential?: string;
    referenceId?: string;
    notes?: string;
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

// ── Guardian ──────────────────────────────────────────

export interface Guardian {
  id: string;
  firstName: string;
  email: string;
  beneficiaryId: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export interface GuardianInput {
  firstName: string;
  email: string;
  beneficiaryId?: string;
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

export type BillingCycle = "MONTHLY" | "ANNUAL";
export type SubscriptionStatus = "NONE" | "ACTIVE" | "CANCELLED" | "PAST_DUE";

export interface PlanData {
  plan: "FREE" | "PRO";
  planActivatedAt: string | null;
  billingCycle: BillingCycle | null;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  limits: PlanLimits;
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
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}
