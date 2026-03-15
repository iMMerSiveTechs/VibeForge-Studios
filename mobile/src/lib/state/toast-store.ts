import { create } from "zustand";

interface ToastStore {
  message: string;
  visible: boolean;
  show: (msg: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  message: "",
  visible: false,
  show: (msg: string) => {
    set({ message: msg, visible: true });
    setTimeout(() => {
      set({ visible: false });
    }, 2000);
  },
}));
