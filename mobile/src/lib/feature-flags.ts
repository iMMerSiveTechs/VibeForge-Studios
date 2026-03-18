import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface FeatureFlagStore {
  SHOW_IMAGE_TAB: boolean;
  SHOW_AUDIO_TAB: boolean;
  SHOW_PAYMENT_TAB: boolean;
  SHOW_REQUEST_TAB: boolean;
  SHOW_ENV_TAB: boolean;
  SHOW_ADVANCED_FORGE: boolean;
  PREVIEW_TIER: 1 | 2 | 3;
  setFlag: (key: string, value: boolean) => void;
  setPreviewTier: (tier: 1 | 2 | 3) => void;
}

export const useFeatureFlags = create<FeatureFlagStore>()(
  persist(
    (set) => ({
      SHOW_IMAGE_TAB: false,
      SHOW_AUDIO_TAB: false,
      SHOW_PAYMENT_TAB: false,
      SHOW_REQUEST_TAB: false,
      SHOW_ENV_TAB: false,
      SHOW_ADVANCED_FORGE: false,
      PREVIEW_TIER: 3,
      setFlag: (key, value) => set({ [key]: value }),
      setPreviewTier: (tier) => set({ PREVIEW_TIER: tier }),
    }),
    {
      name: "vibeforge-feature-flags",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function isEnabled(flag: keyof Omit<FeatureFlagStore, "setFlag" | "setPreviewTier" | "PREVIEW_TIER">): boolean {
  return useFeatureFlags.getState()[flag];
}

export function getPreviewTier(): 1 | 2 | 3 {
  return useFeatureFlags.getState().PREVIEW_TIER;
}
