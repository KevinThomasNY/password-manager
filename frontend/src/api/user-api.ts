import { get, ApiResponse } from "./axios-instance";

export interface LoginRecord {
  loginTime: string;
}

export interface ProfileInformation {
  firstName: string;
  lastName: string;
  userName: string;
}

export const getLoginHistory = async (limit: number) => {
  try {
    const response = await get<ApiResponse<LoginRecord[]>>(
      `/users/login-history?limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching login history", error);
    throw new Error("Failed to fetch login history");
  }
};

export const getProfileInformation = async () => {
  try {
    const response = await get<ApiResponse<ProfileInformation>>(
      `/users/profile-information`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching profile information", error);
    throw new Error("Failed to fetch profile information");
  }
};
