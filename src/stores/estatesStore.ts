import { create } from 'zustand';
import { EstatesService } from '@/services/estates.service';
import type { EstateItem, IdentityVerificationStatus } from '@/lib/types/estates';

interface EstatesStore {
  estates: EstateItem[];
  verificationStatus: IdentityVerificationStatus;
  estatesLoading: boolean;
  hasAttentionRequired: boolean;
  fetchEstates: () => Promise<void>;
}

function computeAttentionRequired(
  estates: EstateItem[],
  verificationStatus: IdentityVerificationStatus,
): boolean {
  return estates.some((e) => {
    if (e.release?.reportAvailable) return true;
    if (
      e.release &&
      e.release.status !== 'COMPLETED' &&
      !e.release.reportAvailable &&
      (verificationStatus === 'UNVERIFIED' || verificationStatus === 'REJECTED')
    ) {
      return true;
    }
    return false;
  });
}

export const useEstatesStore = create<EstatesStore>((set) => ({
  estates: [],
  verificationStatus: 'UNVERIFIED',
  estatesLoading: false,
  hasAttentionRequired: false,

  fetchEstates: async () => {
    set({ estatesLoading: true });
    try {
      const data = await EstatesService.getEstates();
      set({
        estates: data.estates,
        verificationStatus: data.verificationStatus,
        hasAttentionRequired: computeAttentionRequired(
          data.estates,
          data.verificationStatus,
        ),
        estatesLoading: false,
      });
    } catch {
      set({ estatesLoading: false });
    }
  },
}));
