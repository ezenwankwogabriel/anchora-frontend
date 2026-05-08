export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  mfaRequired?: boolean;
  mfaSession?: string;
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

// VaultRecordInput uses frontend form field names.
// The service layer maps these to backend API field names before API calls.
export interface VaultRecordInput {
  category: AssetCategory;
  institutionName: string;
  accountType: string;
  nickname: string;
  holderName?: string;
  usernameOrEmail?: string;
  accountUrl?: string;
  notes?: string;
  beneficiaryId?: string;
}

export interface VaultCompleteness {
  percentComplete: number;
  categoriesCovered: number;
  totalCategories: number;
  lastUpdated: string;
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
  phone?: string;
  isDefault?: boolean;
}

// ── Errors ────────────────────────────────────────────────────────────────

export class ServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}
