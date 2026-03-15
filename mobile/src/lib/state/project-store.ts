import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ProjectStore {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      activeProjectId: null,
      setActiveProjectId: (id) => set({ activeProjectId: id }),
    }),
    {
      name: "vibeforge-project",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
