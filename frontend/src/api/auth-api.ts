import { get, ApiResponse } from "./axios-instance";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthenticatedUser } from "@/store/useAuthStore";

export const checkAuth = async (): Promise<boolean> => {
  try {
    const response = await get<ApiResponse<AuthenticatedUser>>(
      "/users/auth/check"
    );
    if (response.data.userId) {
      useAuthStore.getState().setUser(response.data);
    }
    return true;
  } catch (error) {
    console.error(error);
    useAuthStore.getState().setUser(null);
    return false;
  }
};
