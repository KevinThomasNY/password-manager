import { create } from "zustand";

type AuthState = {
  userId: number | null;
  setUserId: (userId: number | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  setUserId: (userId) => set({ userId }),
}));
