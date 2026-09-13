import { create } from "zustand";
import {
  AccountStatus,
  UserRole,
} from "../../../backend/src/constants/account-policy";

export interface AuthenticatedUser {
  userId: number;
  userName: string;
  role: UserRole;
  status: AccountStatus;
}

type AuthState = {
  userId: number | null;
  user: AuthenticatedUser | null;
  setUser: (user: AuthenticatedUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  user: null,
  setUser: (user) => set({ user, userId: user?.userId ?? null }),
}));
