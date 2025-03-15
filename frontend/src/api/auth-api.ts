import { get, ApiResponse } from "./axios-instance";
import { useAuthStore } from "@/store/useAuthStore";

export const checkAuth = async (): Promise<boolean> => {
  try {
    const response = await get<ApiResponse<{ userId: number }>>(
      "/users/auth/check"
    );
    const userId = response.data.userId;
    if (userId) {
      useAuthStore.getState().setUserId(userId);
    }
    return true;
  } catch (error) {
    console.error(error);
    useAuthStore.getState().setUserId(null);
    return false;
  }
};
