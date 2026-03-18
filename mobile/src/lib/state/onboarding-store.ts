import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  isLoaded: boolean;
  completeOnboarding: () => void;
  load: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasCompletedOnboarding: false,
  isLoaded: false,
  completeOnboarding: () => {
    set({ hasCompletedOnboarding: true });
    AsyncStorage.setItem("onboarding_completed", "true");
  },
  load: async () => {
    const value = await AsyncStorage.getItem("onboarding_completed");
    set({ hasCompletedOnboarding: value === "true", isLoaded: true });
  },
}));
