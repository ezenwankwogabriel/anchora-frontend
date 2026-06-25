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
  accountName: string;        // institution / platform name — shown in list views
  accountType: string | null; // type descriptor, kept for backward compat
  nickname: string | null;    // user's personal label (Sprint 4 accountName field)
  accountUrl: string | null;  // document/link URL (physical categories)
  executorIntent: ExecutorIntent;
  intendedBeneficiary?: string;
  isSelfCustodied: boolean;
  encryptedFields: {
    accountNumber?: string;
    usernameOrEmail?: string;
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

// VaultRecordInput uses Sprint 4 frontend field names.
// The service layer maps institutionName → accountName and accountName → nickname.
export interface VaultRecordInput {
  category: AssetCategory;
  institutionName: string;
  accountName?: string;       // optional label → maps to nickname
  accountType?: string;       // optional type, kept for backward compat
  accountNumber?: string;
  usernameOrEmail?: string;
  accountUrl?: string;
  notes?: string;
  executorIntent?: ExecutorIntent;
  intendedBeneficiary?: string;
  isSelfCustodied?: boolean;
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

export type ExecutorStatus = "PENDING_INVITE" | "ACTIVE" | "DECLINED" | "REMOVED";

export interface Executor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
  status: ExecutorStatus;
  invitedAt: string;
  accountCreatedAt?: string;
  removedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutorInput {
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
}

// ── Release ───────────────────────────────────────────

export type ReleaseReport =
  | { reportUrl: string; ownerFirstName: string; expiresInSeconds: number; reportGeneratedAt: string; accessExpiresAt: string }
  | { message: string; ownerFirstName: string };

// ── Errors ────────────────────────────────────────────────────────────────

// ── Plan ──────────────────────────────────────────────────────────────────────

export interface PlanLimits {
  maxVaultRecords: number;
  canDownloadReport: boolean;
  canConfigureInactivityWindow: boolean;
  executorReceivesReport: boolean;
}

export interface PlanData {
  plan: "FREE" | "PRO";
  planActivatedAt: string | null;
  planExpiresAt: string | null;
  limits: PlanLimits;
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
