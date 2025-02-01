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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const getPasswords = async (
  page: number,
  pageSize: number,
  search?: string
): Promise<PaginatedResponse<Password>> => {
  try {
    const response = await get<ApiResponse<PaginatedResponse<Password>>>(`/passwords?page=${page}&pageSize=${pageSize}&search=${search || ''}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching passwords", error);
    throw new Error("Failed to fetch passwords");
  }
};