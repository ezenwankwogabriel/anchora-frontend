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
  category: AssetCategory;
  institutionName: string;
  accountType: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultCompleteness {
  percentComplete: number;
  categoriesCovered: number;
  totalCategories: number;
  lastUpdated: string;
}

// ── Beneficiaries ─────────────────────────────────────────────────────────

export interface Beneficiary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  relationship: string;
  status: "ACTIVE" | "INVITED" | "PENDING";
}

// ── Inactivity ────────────────────────────────────────────────────────────

export interface InactivityStatus {
  stage: 0 | 1 | 2 | 3;
  lastCheckIn: string;
  nextReminder: string;
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
