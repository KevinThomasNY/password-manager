import { get, post, patch, ApiResponse } from "./axios-instance";

interface LoginCredentials {
  userName: string;
  password: string;
}

export interface LoginResponse {
  data: {
    userName: string;
  };
}

export interface LoginRecord {
  loginTime: string;
}

export interface ProfileInformation {
  firstName?: string;
  lastName?: string;
  userName?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export const loginUser = async (credentials: LoginCredentials) => {
  try {
    const response = await post<ApiResponse<LoginResponse>>(
      "/users/login",
      credentials
    );
    return response;
  } catch (error) {
    console.error("Login failed", error);
    throw new Error("Invalid username or password");
  }
};

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

export const editUserProfile = async (
  id: number,
  formData: FormData
): Promise<ProfileInformation> => {
  const response = await patch<ApiResponse<ProfileInformation>>(
    `/users/${id}`,
    formData
  );
  return response.data;
};
