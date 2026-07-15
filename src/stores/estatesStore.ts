import { create } from 'zustand';
import { EstatesService } from '@/services/estates.service';
import type { EstateItem } from '@/lib/types/estates';
import type { GovIdVerificationStatus } from '@/lib/types';

interface EstatesStore {
  estates: EstateItem[];
  verificationStatus: GovIdVerificationStatus;
  estatesLoading: boolean;
  hasAttentionRequired: boolean;
  fetchEstates: () => Promise<void>;
}

function computeAttentionRequired(
  estates: EstateItem[],
  verificationStatus: GovIdVerificationStatus,
): boolean {
  return estates.some((e) => {
    if (!e.acceptedAt && !e.declinedAt) return true;
    if (e.release?.reportAvailable) return true;
    if (
      e.release &&
      e.release.status !== 'COMPLETED' &&
      !e.release.reportAvailable &&
      (verificationStatus === 'UNVERIFIED' || verificationStatus === 'FAILED')
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
