export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  emailVerified: boolean;
  mfaEnabled: boolean;
  reminderFrequencyDays?: number;
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
  | "SUBSCRIPTION"
  | "OTHER";

export interface VaultRecord {
  id: string;
  userId: string;
  category: AssetCategory;
  accountName: string;       // institution / platform name — shown in list views
  accountType: string | null; // type descriptor (Savings, Stocks, Life, etc.)
  nickname: string | null;   // user's personal label
  accountUrl: string | null;
  encryptedFields: {
    holderName?: string;
    accountNumber?: string;
    usernameOrEmail?: string;
    password?: string;
    cardPin?: string;
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

// VaultRecordInput uses frontend form field names.
// The service layer maps these to backend API field names before API calls.
export interface VaultRecordInput {
  category: AssetCategory;
  institutionName: string;
  accountType: string;
  nickname: string;
  holderName?: string;
  accountNumber?: string;
  usernameOrEmail?: string;
  password?: string;
  cardPin?: string;
  accountUrl?: string;
  notes?: string;
  beneficiaryId?: string;
}

// ── Beneficiaries ─────────────────────────────────────────────────────────

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

export interface Beneficiary {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  relationship: Relationship;
  isDefault: boolean;
  inviteToken: string | null;
  status: BeneficiaryStatus;
  invitedAt: string;
  acceptedAt: string | null;
  vaultRecordCount: number;
}

export interface BeneficiaryDetail {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  relationship: Relationship;
  isDefault: boolean;
  inviteToken: string | null;
  status: BeneficiaryStatus;
  invitedAt: string;
  acceptedAt: string | null;
  vaultRecordIds: string[];
}

export interface BeneficiaryInput {
  name: string;
  email: string;
  relationship: Relationship;
  isDefault?: boolean;
  notes?: string;
}

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

// ── Release ───────────────────────────────────────────

export type ReleaseReport =
  | { reportUrl: string; ownerFirstName: string; expiresInSeconds: number; reportGeneratedAt: string; accessExpiresAt: string }
  | { message: string; ownerFirstName: string };

// ── Errors ────────────────────────────────────────────────────────────────

export class ServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}
