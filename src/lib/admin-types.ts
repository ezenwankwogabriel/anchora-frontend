export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "READ_ONLY";

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "PENDING_DELETION" | "DELETED";

export type ReleaseStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type VerificationStatus =
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "RESUBMITTED"
  | "PERMANENTLY_REJECTED";

export type ActorType = "USER" | "BENEFICIARY" | "ADMIN" | "SYSTEM";

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminAuthResponse {
  admin: AdminUser;
  accessToken: string;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: AccountStatus;
  createdAt: string;
  lastActivityAt: string;
  vaultRecordCount: number;
  beneficiaryCount: number;
}

export interface AdminUserDetail extends AdminUserListItem {
  emailVerifiedAt: string | null;
  mfaEnabled: boolean;
  releases: {
    id: string;
    status: ReleaseStatus;
    triggeredAt: string;
  }[];
}

// ── Releases ──────────────────────────────────────────────────────────────────

export interface AdminRelease {
  id: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  status: ReleaseStatus;
  triggeredAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  beneficiaryCount: number;
}

export interface AdminReleaseBeneficiary {
  id: string;
  name: string;
  email: string;
  verificationStatus: VerificationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface AdminReleaseDetail extends AdminRelease {
  cancelReason: string | null;
  emptyVault: boolean;
  beneficiaries: AdminReleaseBeneficiary[];
}

// ── Audit Logs ────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorType: ActorType;
  action: string;
  targetType: string;
  targetId: string;
  ipAddress: string | null;
  userAgent: string | null;
  result: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogPage {
  entries: AuditLogEntry[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ── Admin Accounts ────────────────────────────────────────────────────────────

export interface AdminAccount {
  id: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  createdById: string | null;
}

// ── Paginated list ────────────────────────────────────────────────────────────

export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
