import { get } from "./axios-instance";

export const checkAuth = async (): Promise<boolean> => {
  try {
    await get("/users/auth/check");
    return true;
  } catch {
    return false;
  }
};
