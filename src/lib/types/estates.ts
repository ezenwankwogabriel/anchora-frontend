import type { GovIdVerificationStatus } from '../types';

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
  notifiedAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  release: EstateRelease | null;
}

export interface EstatesResponse {
  estates: EstateItem[];
  verificationStatus: GovIdVerificationStatus;
}
