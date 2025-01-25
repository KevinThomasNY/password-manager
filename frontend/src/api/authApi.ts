import axiosInstance from "./axiosInstance";

export const checkAuth = async (): Promise<boolean> => {
  try {
    await axiosInstance.get("/users/auth/check");
    return true;
  } catch {
    return false;
  }
};
