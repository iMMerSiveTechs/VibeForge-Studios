import { create } from "zustand";

interface ToastStore {
  message: string;
  visible: boolean;
  show: (msg: string) => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastStore>((set) => ({
  message: "",
  visible: false,
  show: (msg: string) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message: msg, visible: true });
    hideTimer = setTimeout(() => {
      set({ visible: false });
      hideTimer = null;
    }, 2000);
  },
}));
