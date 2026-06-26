export type IdentityVerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED';

export interface EstateRelease {
  id: string;
  status: string;
  triggeredAt: string;
  reportAvailable: boolean;
  reportExpired: boolean;
}

export interface EstateItem {
  estateId: string;
  ownerName: string;
  designatedAt: string;
  executorStatus: 'PENDING_INVITE' | 'ACTIVE' | 'REMOVED';
  release: EstateRelease | null;
}

export interface EstatesResponse {
  estates: EstateItem[];
  verificationStatus: IdentityVerificationStatus;
}
