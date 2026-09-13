import { create } from "zustand";
import { SECURITY_POLICY } from "../../../backend/src/constants/security-policy";

export interface PasswordGeneratorState {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  generatedPassword: string;
  updateSettings: (
    newSettings: Partial<
      Omit<
        PasswordGeneratorState,
        "generatedPassword" | "updateSettings" | "setGeneratedPassword"
      >
    >
  ) => void;
  setGeneratedPassword: (password: string) => void;
}

export const usePasswordGeneratorStore = create<PasswordGeneratorState>(
  (set) => ({
    length: SECURITY_POLICY.GENERATED_PASSWORD_DEFAULT_LENGTH,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    generatedPassword: "",
    updateSettings: (newSettings) =>
      set((state) => ({ ...state, ...newSettings })),
    setGeneratedPassword: (password) => set({ generatedPassword: password }),
  })
);
