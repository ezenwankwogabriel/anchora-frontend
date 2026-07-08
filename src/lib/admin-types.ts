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

export type ActorType = "USER" | "EXECUTOR" | "ADMIN" | "SYSTEM";

export type UserPlan = "FREE" | "PRO";

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

// ── Executor ──────────────────────────────────────────────────────────────────

export interface AdminExecutor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
  invitedAt: string;
  notifiedAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  emailVerifiedAt: string | null;
}

export interface AdminExecutorVerification {
  id: string;
  name: string;
  email: string;
  verificationStatus: VerificationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  inactivityStatus: string;
  lastActiveAt: string;
  isSuspended: boolean;
  createdAt: string;
  vaultItemCount: number;
  executor: { notifiedAt: string | null; acceptedAt: string | null; declinedAt: string | null } | null;
  plan: UserPlan;
}

export type IdentityVerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export interface AdminUserDetail extends AdminUserListItem {
  emailVerifiedAt: string | null;
  mfaEnabled: boolean;
  planActivatedAt: string | null;
  planExpiresAt: string | null;
  identityVerificationStatus: IdentityVerificationStatus;
  identityVerifiedAt: string | null;
  releases: { id: string; status: ReleaseStatus; triggeredAt: string }[];
  executor: AdminExecutor | null;
}

// ── Releases ──────────────────────────────────────────────────────────────────

export interface AdminRelease {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: ReleaseStatus;
  triggeredAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  executor: { name: string; email: string } | null;
}

export interface AdminReleaseDetail extends AdminRelease {
  cancelReason: string | null;
  emptyVault: boolean;
  executor: AdminExecutorVerification | null;
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
  data: AuditLogEntry[];
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
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Dev Tools ─────────────────────────────────────────────────────────────────

export type InactivityStatus = "ACTIVE" | "NOTIFIED" | "RELEASING";

export interface DevUserState {
  userId: string;
  email: string;
  plan: UserPlan;
  inactivityStatus: InactivityStatus;
  notifiedAt: string | null;
  lastActivityAt: string;
  activeRelease: {
    id: string;
    status: ReleaseStatus;
    triggeredAt: string;
  } | null;
}
