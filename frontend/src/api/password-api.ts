import { get } from "./axios-instance";
import { ApiResponse } from "./axios-instance";

export interface Password {
  id: number;
  name: string;
  password: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export const getPasswords = async (): Promise<Password[]> => {
  try {
    const response = await get<ApiResponse<Password[]>>("/passwords");
    return response.data;
  } catch (error) {
    console.error("Error fetching passwords", error);
    throw new Error("Failed to fetch passwords");
  }
};
