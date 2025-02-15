import { get, post, del, ApiResponse } from "./axios-instance";

export interface Password {
  id: number;
  name: string;
  password: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddPasswordInput {
  name: string;
  password: string;
  image?: string;
  questions?: {
    question: string;
    answer: string;
  }[];
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
    const response = await get<ApiResponse<PaginatedResponse<Password>>>(
      `/passwords?page=${page}&pageSize=${pageSize}&search=${search || ""}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching passwords", error);
    throw new Error("Failed to fetch passwords");
  }
};

export const addPassword = async (
  formData: FormData
): Promise<ApiResponse<Password>> => {
  try {
    const response = await post<ApiResponse<Password>>("/passwords", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error("Error adding password", error);
    throw new Error("Failed to add password");
  }
};

export const deletePassword = async (
  id: number
): Promise<ApiResponse<Password>> => {
  try {
    const response = await del<ApiResponse<Password>>(`/passwords/${id}`);
    return response;
  } catch (error) {
    console.error("Error deleting password", error);
    throw new Error("Failed to delete password");
  }
};
